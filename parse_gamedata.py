#!/usr/bin/env python3
"""
Last Asylum — Lua Config Table → JSON Parser
Reads all gamedata Lua tables and outputs structured, cross-referenced JSON
ready for the Next.js wiki.

Usage:
    python parse_gamedata.py <extracted_dir> [-o output_dir]

Example:
    python parse_gamedata.py "C:/Users/user/Documents/LAST ASYLUM/GameData/extracted" -o wiki-data
"""

import json, re, sys, argparse
from pathlib import Path
from collections import defaultdict

try:
    from lupa import LuaRuntime
except ImportError:
    print("Install lupa first: pip install lupa")
    sys.exit(1)

LUA_PREAMBLE = (
    'String="string" Number="number" Boolean="boolean" '
    'function setmetatable(t,mt) return t end '
    'function rawset(t,k,v) t[k]=v return t end\n'
)

# ── Lua → Python conversion ──────────────────────────────────────────

def lua_to_python(obj, depth=0):
    if depth > 25:
        return str(obj)
    if isinstance(obj, (int, float)):
        if isinstance(obj, float) and obj == int(obj) and abs(obj) < 2**53:
            return int(obj)
        return obj
    if isinstance(obj, (str, bool, type(None))):
        return obj
    if hasattr(obj, 'keys'):
        keys = list(obj.keys())
        if not keys:
            return {}
        # Check if array-like
        if all(isinstance(k, (int, float)) for k in keys):
            int_keys = sorted(int(k) for k in keys)
            if int_keys == list(range(1, len(int_keys) + 1)):
                return [lua_to_python(obj[k], depth + 1) for k in sorted(keys)]
        return {str(k): lua_to_python(obj[k], depth + 1) for k in keys}
    return str(obj)


# ── Parse one Lua file ────────────────────────────────────────────────

def parse_lua_table(filepath: Path):
    lua = LuaRuntime()
    loader = lua.eval(
        'function(code) '
        '  local f, err = load(code) '
        '  if f then return f() else return nil end '
        'end'
    )
    code = filepath.read_text(errors='replace').replace('\r', '')
    result = loader(LUA_PREAMBLE + code)
    if result is None or not hasattr(result, '__getitem__'):
        return None, None
    data_obj = result['data']
    if data_obj is None:
        return None, None
    data = lua_to_python(data_obj)
    meta = {
        'len': int(result['len'] or 0) if result['len'] else 0,
        'key': str(result['key'] or 'id') if result['key'] else 'id',
        'records': len(data) if isinstance(data, (dict, list)) else 0,
    }
    enum_obj = result['enum']
    if enum_obj:
        meta['enum'] = lua_to_python(enum_obj)
    return data, meta


# ── Hero name extraction ──────────────────────────────────────────────

def extract_hero_name(select_icon: str) -> str:
    m = re.match(r'Pic_Hero_(.+?)_List', select_icon)
    if not m:
        return select_icon
    raw = m.group(1)
    # Insert spaces before capitals: "MaxSteele" → "Max Steele"
    return re.sub(r'([a-z])([A-Z])', r'\1 \2', raw)


QUALITY_NAMES = {0: "Common", 1: "White", 2: "Green", 3: "Blue",
                 4: "Purple", 5: "Orange", 6: "Red"}
ARMY_NAMES = {0: "Universal", 1: "Infantry", 2: "Vehicle", 3: "Aircraft"}
CAMP_NAMES = {1: "Light", 2: "Medium", 3: "Heavy", 4: "Internal"}


# ── Build enriched wiki data ─────────────────────────────────────────

def build_wiki_data(tables: dict, out_dir: Path):
    """Cross-reference tables and produce wiki-ready JSON files."""

    wiki = out_dir / "wiki"
    wiki.mkdir(parents=True, exist_ok=True)

    # ── Heroes ────────────────────────────────────────────────────────
    hero_info = tables.get('HeroInfo', {})
    hero_skills_all = tables.get('HeroSkillBase', {})
    hero_levels = tables.get('HeroLevel', {})
    hero_stars = tables.get('HeroStar', {})
    skill_table = tables.get('Skill', {})
    skill_effect = tables.get('SkillEffect', {})
    hero_skill_upgrade = tables.get('HeroSkillUpgrade', {})
    hero_skill_show = tables.get('HeroSkillShow', {})

    # Group skills by heroId
    skills_by_hero = defaultdict(list)
    for sid, sk in hero_skills_all.items():
        hid = str(sk.get('heroId', ''))
        skills_by_hero[hid].append(sk)

    # Group levels by type
    levels_by_type = defaultdict(list)
    for lid, lv in hero_levels.items():
        levels_by_type[str(lv.get('type', 0))].append(lv)

    heroes_wiki = {}
    for hid, h in hero_info.items():
        si = h.get('selectIcon', '')
        name = extract_hero_name(si)
        quality = h.get('quality', 0)

        # Skip non-hero entries (monsters, NPCs with no selectIcon)
        if not si or 'Pic_Hero' not in si:
            continue

        hero_entry = {
            'id': hid,
            'name': name,
            'quality': quality,
            'qualityName': QUALITY_NAMES.get(quality, str(quality)),
            'armyType': h.get('armyType', 0),
            'armyName': ARMY_NAMES.get(h.get('armyType', 0), 'Unknown'),
            'campType': h.get('campType', 0),
            'campName': CAMP_NAMES.get(h.get('campType', 0), 'Unknown'),
            'maxAbility': h.get('maxAbility', 0),
            'maxHonorLevel': h.get('maxHonorLevel', 0),
            'heroStarRating': h.get('heroStarRating', 0),
            'attackCd': h.get('attackCd', 0),
            'attackRadius': h.get('attackRadius', 0),
            'rpgAttackRadius': h.get('rpgAttackRadius', 0),
            'skill_count': h.get('skill_count', 0),
            'skillTemplate': h.get('skillTemplate', 0),
            # Image refs
            'image': h.get('image', ''),           # pic_card2 (thumbnail)
            'heroIcon': h.get('heroIcon', ''),      # pic_card4 (portrait)
            'heroPic': h.get('heroPic', ''),        # pic_card3 (bust)
            'honorImage': h.get('honorImage', ''),  # pic_card5
            'spineId': h.get('spineId', ''),        # pic_card6 (animated)
            'selectIcon': si,
            # Progression
            'levelBenefit': h.get('levelBenefit', []),
            'levelRatio': h.get('levelRatio', []),
            'starRatio': h.get('starRatio', []),
            'honorLevelUnlockEffect': h.get('honorLevelUnlockEffect', []),
            # Fragment
            'medalId': h.get('medalId', ''),
            'medalAmount': h.get('medalAmount', 0),
            'fragmentItemId': h.get('fragmentItemId', ''),
            'fragmentItemCount': h.get('fragmentItemCount', 0),
            # Building requirement
            'buildingId': h.get('buildingId', 0),
            'buildingLevel': h.get('buildingLevel', 0),
            # Skills for this hero
            'skills': sorted(skills_by_hero.get(hid, []),
                             key=lambda s: s.get('skillSlot', 0)),
        }
        heroes_wiki[hid] = hero_entry

    save_json(wiki / "heroes.json", heroes_wiki)
    print(f"  heroes: {len(heroes_wiki)}")

    # ── Hero progression (levels & stars) ─────────────────────────────
    save_json(wiki / "hero_levels.json", hero_levels)
    save_json(wiki / "hero_stars.json", hero_stars)
    save_json(wiki / "hero_skill_upgrades.json", hero_skill_upgrade)
    print(f"  hero_levels: {len(hero_levels)}, hero_stars: {len(hero_stars)}")

    # ── Skills ────────────────────────────────────────────────────────
    save_json(wiki / "skills.json", skill_table)
    save_json(wiki / "skill_effects.json", skill_effect)
    save_json(wiki / "hero_skill_show.json", hero_skill_show)
    print(f"  skills: {len(skill_table)}, skill_effects: {len(skill_effect)}")

    # ── Items ─────────────────────────────────────────────────────────
    items = tables.get('Item', {})
    item_benefit = tables.get('ItemBenefit', {})
    item_synthesis = tables.get('ItemSynthesis', {})
    item_get_source = tables.get('ItemGetSource', {})
    item_icon = tables.get('ItemIcon', {})

    items_wiki = {}
    for iid, item in items.items():
        items_wiki[iid] = {
            **item,
            'id': iid,
        }

    save_json(wiki / "items.json", items_wiki)
    save_json(wiki / "item_synthesis.json", item_synthesis)
    save_json(wiki / "item_sources.json", item_get_source)
    print(f"  items: {len(items_wiki)}")

    # ── Buildings ─────────────────────────────────────────────────────
    buildings = tables.get('Building', {})
    building_upgrades = tables.get('BuildingUpgrade', {})
    building_levels = tables.get('BuildingLevel', {})
    building_effects = tables.get('BuildingEffect', {})
    building_production = tables.get('BuildingProduction', {})

    save_json(wiki / "buildings.json", buildings)
    save_json(wiki / "building_upgrades.json", building_upgrades)
    save_json(wiki / "building_levels.json", building_levels)
    save_json(wiki / "building_effects.json", building_effects)
    save_json(wiki / "building_production.json", building_production)
    print(f"  buildings: {len(buildings)}, upgrades: {len(building_upgrades)}")

    # ── Soldiers / Troops ─────────────────────────────────────────────
    soldiers = tables.get('SoldierAttr', {})
    soldier_type = tables.get('SoldierType', {})
    soldier_restraint = tables.get('SoldierRestraint', {})
    army_attr = tables.get('ArmyTypeAttr', {})
    slg_army = tables.get('SlgArmyAttr', {})

    save_json(wiki / "soldiers.json", soldiers)
    save_json(wiki / "soldier_types.json", soldier_type)
    save_json(wiki / "soldier_restraints.json", soldier_restraint)
    save_json(wiki / "army_attrs.json", army_attr)
    save_json(wiki / "slg_army_attrs.json", slg_army)
    print(f"  soldiers: {len(soldiers)}, slg_army: {len(slg_army)}")

    # ── Research / Tech ───────────────────────────────────────────────
    college_tech = tables.get('CollegeTech', {})
    college_type = tables.get('CollegeTechType', {})
    union_tech = tables.get('UnionTech', {})
    union_tech_type = tables.get('UnionTechType', {})
    union_tech_upgrade = tables.get('UnionTechUpgrade', {})

    save_json(wiki / "research.json", college_tech)
    save_json(wiki / "research_types.json", college_type)
    save_json(wiki / "union_tech.json", union_tech)
    save_json(wiki / "union_tech_types.json", union_tech_type)
    save_json(wiki / "union_tech_upgrades.json", union_tech_upgrade)
    print(f"  research: {len(college_tech)}, union_tech: {len(union_tech)}")

    # ── Equipment ─────────────────────────────────────────────────────
    equip = tables.get('EquipmentBase', {})
    equip_promo = tables.get('EquipmentPromotion', {})
    equip_str = tables.get('EquipmentStrengthen', {})
    equip_mat_syn = tables.get('EquipmentMaterialSynthesis', {})

    save_json(wiki / "equipment.json", equip)
    save_json(wiki / "equipment_promotion.json", equip_promo)
    save_json(wiki / "equipment_strengthen.json", equip_str)
    print(f"  equipment: {len(equip)}")

    # ── Monsters ──────────────────────────────────────────────────────
    monsters = tables.get('SlgMonsterInfo', {})
    monster_profile = tables.get('MonsterProfile', {})
    monster_refresh = tables.get('MonsterRefresh', {})
    attack_boss = tables.get('AttackBoss', {})
    attack_boss_monster = tables.get('AttackBossMonster', {})
    abyss_boss = tables.get('AbyssBoss', {})
    hunt_war = tables.get('HuntWarMonster', {})

    save_json(wiki / "monsters.json", monsters)
    save_json(wiki / "monster_profiles.json", monster_profile)
    save_json(wiki / "monster_refresh.json", monster_refresh)
    save_json(wiki / "attack_bosses.json", attack_boss)
    save_json(wiki / "abyss_bosses.json", abyss_boss)
    save_json(wiki / "hunt_war_monsters.json", hunt_war)
    print(f"  monsters: {len(monsters)}, bosses: {len(attack_boss)}")

    # ── Shops ─────────────────────────────────────────────────────────
    shops = tables.get('ShopBase', {})
    shop_pages = tables.get('ShopPage', {})
    exchange = tables.get('ExchangeShop', {})
    union_shop = tables.get('UnionShop', {})

    save_json(wiki / "shops.json", shops)
    save_json(wiki / "shop_pages.json", shop_pages)
    save_json(wiki / "exchange_shop.json", exchange)
    save_json(wiki / "union_shop.json", union_shop)
    print(f"  shops: {len(shops)}, exchange: {len(exchange)}")

    # ── Formulas ──────────────────────────────────────────────────────
    formulas = tables.get('Formula', {})
    save_json(wiki / "formulas.json", formulas)
    print(f"  formulas: {len(formulas)}")

    # ── Activities / Events ───────────────────────────────────────────
    activity_base = tables.get('ActivityBase', {})
    activity_display = tables.get('ActivityDisplay', {})
    activity_target = tables.get('ActivityTarget', {})

    save_json(wiki / "activities.json", activity_base)
    save_json(wiki / "activity_display.json", activity_display)
    save_json(wiki / "activity_targets.json", activity_target)
    print(f"  activities: {len(activity_base)}")

    # ── VIP ───────────────────────────────────────────────────────────
    vip = tables.get('VipInfo', {})
    vip_priv = tables.get('VipPrivilege', {})
    save_json(wiki / "vip.json", vip)
    save_json(wiki / "vip_privileges.json", vip_priv)
    print(f"  vip: {len(vip)}")

    # ── UAV / Drones ──────────────────────────────────────────────────
    uav_active = tables.get('UavActive', {})
    uav_advance = tables.get('UavAdvance', {})
    uav_comp = tables.get('UavComponent', {})
    uav_level = tables.get('UavLevel', {})
    uav_skill = tables.get('UavSkillDes', {})

    save_json(wiki / "uav_active.json", uav_active)
    save_json(wiki / "uav_advance.json", uav_advance)
    save_json(wiki / "uav_components.json", uav_comp)
    save_json(wiki / "uav_levels.json", uav_level)
    save_json(wiki / "uav_skills.json", uav_skill)
    print(f"  uav: {len(uav_comp)} components, {len(uav_level)} levels")

    # ── Drops ─────────────────────────────────────────────────────────
    drops = tables.get('DropInfo', {})
    drop_open = tables.get('DropOpen', {})
    save_json(wiki / "drops.json", drops)
    save_json(wiki / "drop_open.json", drop_open)
    print(f"  drops: {len(drops)}")

    # ── Player / Misc ─────────────────────────────────────────────────
    player_upgrade = tables.get('PlayerUpgrade', {})
    player_info = tables.get('PlayerInfo', {})
    func_unlock = tables.get('FunctionUnlock', {})
    parameter = tables.get('Parameter', {})

    save_json(wiki / "player_upgrade.json", player_upgrade)
    save_json(wiki / "player_info.json", player_info)
    save_json(wiki / "function_unlock.json", func_unlock)
    save_json(wiki / "parameters.json", parameter)
    print(f"  parameters: {len(parameter)}")

    # ── Summary index ─────────────────────────────────────────────────
    summary = {
        'version': '1.0.375',
        'tables_parsed': len(tables),
        'heroes': len(heroes_wiki),
        'items': len(items_wiki),
        'buildings': len(buildings),
        'skills': len(skill_table),
        'soldiers': len(soldiers),
        'monsters': len(monsters),
        'research': len(college_tech),
        'formulas': len(formulas),
        'activities': len(activity_base),
    }
    save_json(wiki / "_summary.json", summary)


def save_json(path: Path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ── Main ──────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Parse Last Asylum Lua tables → JSON")
    parser.add_argument("extracted_dir", help="Path to extracted/ folder from asylum_ripper.py")
    parser.add_argument("-o", "--output", default="wiki-data", help="Output directory")
    args = parser.parse_args()

    ext_dir = Path(args.extracted_dir)
    out_dir = Path(args.output)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Find the gamedata_basedb_f_basedata_jit folder
    candidates = list(ext_dir.rglob("gamedata_basedb_f_basedata_jit"))
    if not candidates:
        # Maybe it's directly the folder
        if (ext_dir / "HeroInfo.lua").exists():
            lua_dir = ext_dir
        else:
            print(f"ERROR: Can't find gamedata_basedb_f_basedata_jit in {ext_dir}")
            sys.exit(1)
    else:
        lua_dir = candidates[0]

    print(f"Lua tables dir: {lua_dir}")
    lua_files = sorted(lua_dir.glob("*.lua"))
    print(f"Found {len(lua_files)} .lua files")

    # Phase 1: Parse all Lua → JSON
    raw_dir = out_dir / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    tables = {}
    ok = 0
    empty = 0
    fail = 0

    for i, lua_file in enumerate(lua_files):
        name = lua_file.stem
        try:
            data, meta = parse_lua_table(lua_file)
            if data is not None and meta is not None:
                rec_count = meta['records']
                if rec_count > 0:
                    tables[name] = data
                    save_json(raw_dir / f"{name}.json", data)
                    ok += 1
                else:
                    empty += 1
            else:
                fail += 1
        except Exception as e:
            fail += 1
            if fail <= 5:
                print(f"  FAIL {name}: {e}")

        if (i + 1) % 100 == 0:
            print(f"  [{i+1}/{len(lua_files)}] {ok} ok, {empty} empty, {fail} failed")

    print(f"\nPhase 1 done: {ok} tables with data, {empty} empty, {fail} failed")

    # Phase 2: Build cross-referenced wiki data
    print("\nPhase 2: Building wiki data...")
    build_wiki_data(tables, out_dir)

    total_size = sum(f.stat().st_size for f in out_dir.rglob("*.json"))
    print(f"\nAll done! {total_size / 1024 / 1024:.1f} MB of JSON in {out_dir}/")
    print(f"  raw/     — {ok} individual table dumps")
    print(f"  wiki/    — cross-referenced wiki-ready data")


if __name__ == "__main__":
    main()
