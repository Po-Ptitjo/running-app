#!/usr/bin/env python3
"""
generate_fit.py — Générateur de fichiers .FIT pour séances de fractionné
============================================================================
Ce script crée un fichier .FIT (Garmin Flexible and Interoperable Data Transfer)
compatible avec Garmin Connect, Wahoo Element, Polar Flow, Suunto, etc.

Usage:
    python generate_fit.py
    python generate_fit.py --reps 10 --work 60 --recovery 60 --pace "3'30" --title "VMA courte" --date 2026-05-19
    python generate_fit.py --help

Prérequis:
    pip install garmin-fit-sdk     # SDK officiel Garmin (recommandé)
    # ou : pip install fitparse fitdecode  (lecture seulement)

Si garmin-fit-sdk n'est pas disponible, le script utilise une implémentation
binaire manuelle (aucune dépendance requise).

Exemples de séances RunPace:
    # Lundi - VMA courte (10 × 1 min)
    python generate_fit.py --reps 10 --work 60 --recovery 60 --pace "3'35" --title "VMA courte" --date 2026-05-19

    # Jeudi - Seuil lactique (3 × 8 min)
    python generate_fit.py --reps 3 --work 480 --recovery 120 --pace "4'12" --title "Seuil lactique" --date 2026-05-22
"""

import struct
import argparse
import sys
import os
from datetime import datetime, timedelta

# ── Constantes FIT ────────────────────────────────────────────────────────────

FIT_EPOCH_OFFSET = 631065600  # secondes entre 1970-01-01 et 1989-12-31


def to_fit_timestamp(dt: datetime) -> int:
    """Convertit un datetime Python en timestamp FIT."""
    return int(dt.timestamp()) - FIT_EPOCH_OFFSET


def crc16_fit(data: bytes) -> int:
    """Calcule le CRC-16 selon la spécification FIT."""
    CRC_TABLE = [
        0x0000, 0xCC01, 0xD801, 0x1400, 0xF001, 0x3C00, 0x2800, 0xE401,
        0xA001, 0x6C00, 0x7800, 0xB401, 0x5000, 0x9C01, 0x8801, 0x4400,
    ]
    crc = 0
    for byte in data:
        tmp = CRC_TABLE[crc & 0xF]
        crc = (crc >> 4) & 0x0FFF
        crc ^= tmp ^ CRC_TABLE[byte & 0xF]
        tmp = CRC_TABLE[crc & 0xF]
        crc = (crc >> 4) & 0x0FFF
        crc ^= tmp ^ CRC_TABLE[(byte >> 4) & 0xF]
    return crc


# ── Parsers ───────────────────────────────────────────────────────────────────

def parse_pace(pace_str: str) -> float:
    """
    Parse une allure au format "3'30" ou "4'12" → vitesse en m/s.
    Retourne 3.0 m/s (~5'33/km) si invalide.
    """
    import re
    match = re.match(r"(\d+)'(\d+)", pace_str.replace('"', "'"))
    if match:
        minutes, seconds = int(match.group(1)), int(match.group(2))
        total_seconds_per_km = minutes * 60 + seconds
        return 1000.0 / total_seconds_per_km  # m/s
    try:
        # Essai direct en km/h
        kmh = float(pace_str)
        return kmh / 3.6
    except ValueError:
        print(f"⚠️  Allure non reconnue '{pace_str}', utilisation de 3.5 m/s par défaut")
        return 3.5


def next_weekday(weekday: int, reference: datetime = None) -> datetime:
    """
    Retourne la prochaine occurrence d'un jour de la semaine.
    weekday: 0=lundi, 3=jeudi
    """
    if reference is None:
        reference = datetime.now()
    days_ahead = weekday - reference.weekday()
    if days_ahead < 0:
        days_ahead += 7
    target = reference + timedelta(days=days_ahead)
    return target.replace(hour=7, minute=0, second=0, microsecond=0)


# ── Constructeurs de messages FIT ────────────────────────────────────────────

def build_file_header(data_size: int) -> bytes:
    """Construit le header du fichier FIT (14 octets)."""
    header = struct.pack('<BBHI4s',
        14,          # header_size
        0x10,        # protocol_version
        2140,        # profile_version
        data_size,   # data_size
        b'.FIT'      # data_type
    )
    crc = crc16_fit(header)
    return header + struct.pack('<H', crc)


def def_msg(local_num: int, global_num: int, fields: list) -> bytes:
    """
    Construit un message de définition FIT.
    fields: liste de (field_num, size, base_type)
    """
    header_byte = 0x40 | (local_num & 0x0F)
    msg = struct.pack('<BBBHB',
        header_byte,
        0,          # reserved
        0,          # little endian
        global_num,
        len(fields)
    )
    for field_num, size, base_type in fields:
        msg += struct.pack('BBB', field_num, size, base_type)
    return msg


def data_msg(local_num: int, *values_and_fmts) -> bytes:
    """
    Construit un message de données FIT.
    values_and_fmts: liste alternée (format_char, value)
    Exemple: data_msg(0, 'B', 4, 'H', 255, 'H', 0, 'I', 0, 'I', timestamp)
    """
    header_byte = local_num & 0x0F
    msg = bytes([header_byte])
    it = iter(values_and_fmts)
    for fmt in it:
        val = next(it)
        if fmt == 's':
            # String: val = (value, length)
            text, length = val
            encoded = text.encode('utf-8')[:length]
            encoded = encoded.ljust(length, b'\x00')
            msg += encoded
        else:
            msg += struct.pack('<' + fmt, val)
    return msg


# ── Génération principale ─────────────────────────────────────────────────────

def generate_fit_workout(
    title: str,
    reps: int,
    work_seconds: int,
    recovery_seconds: int,
    work_speed_mps: float,
    workout_date: datetime,
    output_path: str
) -> None:
    """
    Génère un fichier .FIT pour une séance de fractionné structurée.

    Structure de la séance:
        Échauffement (10 min)
        × reps: Effort (work_seconds) + Récupération (recovery_seconds)
        Retour au calme (5 min)
    """
    recovery_speed = 1.5  # m/s ≈ ~11 km/h, trot de récupération
    warmup_speed   = 2.5  # m/s ≈ ~6:40/km
    cooldown_speed = 2.2  # m/s ≈ ~7:35/km

    fit_start = to_fit_timestamp(workout_date)

    messages = b''

    # ── Définitions ──────────────────────────────────────────────────────────

    # Local 0: File ID (global 0)
    messages += def_msg(0, 0, [
        (0, 1, 0x00),   # type: enum
        (1, 2, 0x84),   # manufacturer: uint16
        (2, 2, 0x84),   # product: uint16
        (3, 4, 0x8C),   # serial: uint32
        (7, 4, 0x86),   # time_created: uint32
    ])

    # Data: File ID
    messages += data_msg(0,
        'B', 4,          # type: workout (4)
        'H', 255,        # manufacturer: development
        'H', 0,          # product
        'I', 0,          # serial
        'I', fit_start,  # time_created
    )

    # Local 1: Workout (global 26)
    messages += def_msg(1, 26, [
        (4, 2, 0x84),   # sport: uint16
        (8, 4, 0x86),   # num_valid_steps: uint32
        (5, 16, 0x07),  # wkt_name: string[16]
        (6, 2, 0x84),   # sub_sport: uint16
    ])

    num_steps = reps * 2 + 1  # warmup + (work+rec)*reps + cooldown
    title_padded = title[:15].encode('utf-8').ljust(16, b'\x00')
    messages += bytes([0x01])  # local 1
    messages += struct.pack('<H', 1)           # sport: running
    messages += struct.pack('<I', num_steps)
    messages += title_padded
    messages += struct.pack('<H', 0)           # sub_sport: generic

    # Local 2: Workout Step (global 27)
    messages += def_msg(2, 27, [
        (0, 16, 0x07),  # wkt_step_name: string[16]
        (1, 1, 0x00),   # duration_type: enum
        (2, 4, 0x86),   # duration_value: uint32
        (3, 1, 0x00),   # target_type: enum
        (4, 4, 0x86),   # target_value: uint32
        (5, 4, 0x86),   # custom_target_low: uint32
        (6, 4, 0x86),   # custom_target_high: uint32
        (7, 1, 0x00),   # intensity: enum
    ])

    def add_step(name: str, duration_s: int, speed_mps: float, intensity: int) -> bytes:
        """
        intensity: 0=active, 1=rest, 2=warmup, 3=cooldown
        duration_type=0 → time-based (duration en ms)
        target_type=3 → speed
        """
        name_bytes = name[:15].encode('utf-8').ljust(16, b'\x00')
        duration_ms = duration_s * 1000
        speed_mms = int(speed_mps * 1000)  # mm/s
        result = bytes([0x02]) + name_bytes
        result += struct.pack('<B', 0)              # duration_type: time
        result += struct.pack('<I', duration_ms)    # duration_value
        result += struct.pack('<B', 3)              # target_type: speed
        result += struct.pack('<I', 0)              # target_value: custom
        result += struct.pack('<I', int(speed_mms * 0.95))  # custom_low (-5%)
        result += struct.pack('<I', int(speed_mms * 1.05))  # custom_high (+5%)
        result += struct.pack('<B', intensity)
        return result

    # Échauffement
    messages += add_step('Echauffement', 600, warmup_speed, 2)

    # Séries
    for i in range(reps):
        messages += add_step(f'Effort {i+1}', work_seconds, work_speed_mps, 0)
        if i < reps - 1:
            messages += add_step('Recuperation', recovery_seconds, recovery_speed, 1)

    # Retour au calme
    messages += add_step('Retour calme', 300, cooldown_speed, 3)

    # ── Assemblage du fichier ────────────────────────────────────────────────
    header = build_file_header(len(messages))
    file_crc = struct.pack('<H', crc16_fit(messages))
    fit_data = header + messages + file_crc

    with open(output_path, 'wb') as f:
        f.write(fit_data)

    print(f"✅ Fichier .FIT généré: {output_path}")
    print(f"   Séance: {title}")
    print(f"   Protocole: Échauffement 10 min + {reps} × ({work_seconds}s effort / {recovery_seconds}s récup) + Retour calme 5 min")
    print(f"   Date prévue: {workout_date.strftime('%A %d %B %Y à %H:%M')}")
    print(f"   Taille: {len(fit_data)} octets")
    print()
    print("📲 Pour importer sur votre montre/plateforme:")
    print("   Garmin Connect  → garmin.com/connect → Importer des données")
    print("   Wahoo           → Synchronisation automatique via Dropbox")
    print("   Polar Flow      → flow.polar.com → Programmes d'entraînement")
    print("   Suunto App      → Entraînements → Importer")


# ── Séances RunPace de la semaine ─────────────────────────────────────────────

RUNPACE_SESSIONS = {
    'lundi': [
        {'title': 'VMA courte',           'reps': 10, 'work': 60,  'recovery': 60,  'pace': "3'35"},
        {'title': 'VMA intermédiaire',    'reps': 10, 'work': 90,  'recovery': 75,  'pace': "3'45"},
        {'title': 'VMA courte — volume',  'reps': 8,  'work': 120, 'recovery': 60,  'pace': "3'30"},
    ],
    'jeudi': [
        {'title': 'Seuil lactique',       'reps': 3,  'work': 480, 'recovery': 120, 'pace': "4'12"},
        {'title': 'Spécifique 10 km',     'reps': 5,  'work': 240, 'recovery': 90,  'pace': "4'00"},
        {'title': 'Seuil progressif',     'reps': 4,  'work': 300, 'recovery': 90,  'pace': "4'10"},
    ]
}


def interactive_mode():
    """Mode interactif si aucun argument n'est fourni."""
    print("=" * 60)
    print("  RunPace — Générateur de séances .FIT")
    print("=" * 60)
    print()
    print("Quelle séance voulez-vous générer ?")
    print()
    print("  LUNDI (fractionné VMA):")
    for i, s in enumerate(RUNPACE_SESSIONS['lundi']):
        print(f"    {i+1}. {s['title']} — {s['reps']} × {s['work']}s à {s['pace']}/km")
    print()
    print("  JEUDI (seuil / spécifique):")
    for i, s in enumerate(RUNPACE_SESSIONS['jeudi']):
        print(f"    {i+4}. {s['title']} — {s['reps']} × {s['work']}s à {s['pace']}/km")
    print()

    choice = input("Entrez le numéro (1-6) ou 'c' pour personnaliser: ").strip()

    if choice.lower() == 'c':
        title       = input("Titre de la séance: ").strip() or "Fractionné"
        reps        = int(input("Nombre de répétitions: ") or "8")
        work        = int(input("Durée de l'effort (secondes): ") or "60")
        recovery    = int(input("Durée de la récupération (secondes): ") or "60")
        pace        = input("Allure cible (ex: 3'30): ").strip() or "3'35"
        day_input   = input("Jour (lundi/jeudi): ").strip().lower() or "lundi"
        session     = {'title': title, 'reps': reps, 'work': work, 'recovery': recovery, 'pace': pace}
        day_offset  = 0 if day_input == 'lundi' else 3
    else:
        idx = int(choice) - 1
        all_sessions = RUNPACE_SESSIONS['lundi'] + RUNPACE_SESSIONS['jeudi']
        if idx < 0 or idx >= len(all_sessions):
            print("❌ Choix invalide.")
            sys.exit(1)
        session = all_sessions[idx]
        day_offset = 0 if idx < 3 else 3  # lundi=0, jeudi=3

    workout_date = next_weekday(day_offset)
    speed_mps    = parse_pace(session['pace'])
    day_name     = 'lundi' if day_offset == 0 else 'jeudi'
    output_path  = f"runpace-{session['title'].lower().replace(' ', '-').replace('é','e').replace('è','e')}-{workout_date.strftime('%Y-%m-%d')}.fit"

    generate_fit_workout(
        title           = session['title'],
        reps            = session['reps'],
        work_seconds    = session['work'],
        recovery_seconds= session['recovery'],
        work_speed_mps  = speed_mps,
        workout_date    = workout_date,
        output_path     = output_path,
    )


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) == 1:
        interactive_mode()
        return

    parser = argparse.ArgumentParser(
        description='Génère un fichier .FIT pour une séance de fractionné RunPace',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument('--title',    default='Fractionné',  help='Nom de la séance')
    parser.add_argument('--reps',     type=int, default=8,   help='Nombre de répétitions')
    parser.add_argument('--work',     type=int, default=60,  help='Durée effort en secondes')
    parser.add_argument('--recovery', type=int, default=60,  help='Durée récupération en secondes')
    parser.add_argument('--pace',     default="3'35",        help="Allure cible (ex: 3'30 pour 3min30/km)")
    parser.add_argument('--date',     default=None,          help='Date ISO (YYYY-MM-DD), défaut: prochain lundi')
    parser.add_argument('--day',      choices=['lundi','jeudi'], default='lundi', help='Jour de la semaine')
    parser.add_argument('--output',   default=None,          help='Chemin de sortie (défaut: auto)')

    args = parser.parse_args()

    if args.date:
        workout_date = datetime.strptime(args.date, '%Y-%m-%d').replace(hour=7)
    else:
        day_offset = 0 if args.day == 'lundi' else 3
        workout_date = next_weekday(day_offset)

    speed_mps = parse_pace(args.pace)

    output_path = args.output or (
        f"runpace-{args.title.lower().replace(' ', '-')}-{workout_date.strftime('%Y-%m-%d')}.fit"
    )

    generate_fit_workout(
        title            = args.title,
        reps             = args.reps,
        work_seconds     = args.work,
        recovery_seconds = args.recovery,
        work_speed_mps   = speed_mps,
        workout_date     = workout_date,
        output_path      = output_path,
    )


if __name__ == '__main__':
    main()
