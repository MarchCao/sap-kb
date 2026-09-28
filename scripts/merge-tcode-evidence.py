#!/usr/bin/env python3
"""将调研得到的 SAP 官方证据合并进 data/tcode-kb.json.
用法: python3 scripts/merge-tcode-evidence.py data/tcode-evidence.json
证据文件格式 (JSON 数组, 每条):
{
  "code": "MM03",
  "version": "S/4HANA 2022",
  "lifecycle": "ACTIVE|DEPRECATED|OBSOLETE|REPLACED",
  "sap_status_original": "Active",          # SAP 官方原文用词, 照抄
  "availability": "AVAILABLE|LIMITED|NOT_AVAILABLE|UNKNOWN",  # 可选, 默认 UNKNOWN
  "recommendation": "RECOMMENDED|NOT_RECOMMENDED|NEUTRAL|UNKNOWN",  # 可选
  "successor": "BP",                        # 可选, 仅官方明确声明才填
  "successor_kind": "TCODE|FIORI",          # 可选, 默认 TCODE
  "successor_relationship": "REPLACED_BY|RELATED_FIORI_APP",  # 可选, 默认 REPLACED_BY
  "source_url": "https://help.sap.com/...", # 必填
  "source_title": "...",                    # 必填
  "source_type": "SAP Help|Simplification List|SAP Note|SAP Learning",  # 必填
  "source_version": "S/4HANA 2022",          # 必填
  "source_excerpt": "官方原文短句",          # 必填
  "verified_at": "2026-09-28"               # 可选, 默认今天
}
规则:
- lifecycle 必须是 SAP 官方原文对应的状态, 不做推测转换
- 同一 code+version 已存在则跳过 (不覆盖)
- data_quality 重算: 有完整证据( url+excerpt+version ) -> VERIFIED;
  有证据但缺字段 -> PARTIALLY_VERIFIED; 无证据 -> NEEDS_REVIEW
"""
import json, os, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB = os.path.join(ROOT, 'data', 'tcode-kb.json')
TODAY = datetime.date.today().isoformat()

def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    ev_path = sys.argv[1]
    kb = json.load(open(KB, encoding='utf-8'))
    by_code = {r['code']: r for r in kb}
    records = json.load(open(ev_path, encoding='utf-8'))
    added_v, added_s, skipped = 0, 0, 0
    for e in records:
        code = e.get('code', '').strip().upper()
        r = by_code.get(code)
        if not r:
            print(f'  跳过: {code} 不在知识库中'); skipped += 1; continue
        for req in ('version', 'lifecycle', 'source_url', 'source_title',
                    'source_type', 'source_version', 'source_excerpt'):
            if not e.get(req):
                print(f'  跳过: {code} 缺少必填字段 {req}'); skipped += 1; break
        else:
            ver = e['version'].strip()
            if any(v['version'] == ver for v in r['versions']):
                print(f'  跳过: {code}@{ver} 已存在'); skipped += 1; continue
            r['versions'].append({
                'version': ver,
                'availability': e.get('availability', 'UNKNOWN'),
                'lifecycle': e['lifecycle'].strip().upper(),
                'recommendation': e.get('recommendation', 'UNKNOWN'),
                'sap_status_original': e.get('sap_status_original', ''),
                'evidence': {
                    'source_url': e['source_url'].strip(),
                    'source_title': e['source_title'].strip(),
                    'source_type': e['source_type'].strip(),
                    'source_version': e['source_version'].strip(),
                    'source_excerpt': e['source_excerpt'].strip(),
                    'verified_at': e.get('verified_at', TODAY),
                },
            })
            added_v += 1
            succ = (e.get('successor') or '').strip()
            if succ:
                kind = e.get('successor_kind', 'TCODE').strip().upper()
                rel = e.get('successor_relationship', 'REPLACED_BY').strip().upper()
                if not any(s['to'] == succ for s in r['successors']):
                    r['successors'].append({
                        'to': succ, 'kind': kind, 'relationship': rel,
                        'source_url': e['source_url'].strip(),
                        'source_excerpt': e['source_excerpt'].strip(),
                        'verified_at': e.get('verified_at', TODAY),
                    })
                    added_s += 1
            # 重算数据质量 (证据记录可带 data_quality 强制指定)
            if e.get('data_quality') in ('VERIFIED', 'PARTIALLY_VERIFIED', 'NEEDS_REVIEW'):
                r['data_quality'] = e['data_quality']
                continue
            evs = [v['evidence'] for v in r['versions'] if v.get('evidence')]
            if any(ev.get('source_url') and ev.get('source_excerpt') and ev.get('source_version') for ev in evs):
                r['data_quality'] = 'VERIFIED'
            elif evs:
                r['data_quality'] = 'PARTIALLY_VERIFIED'
            continue
    json.dump(kb, open(KB, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    open(KB, 'a', encoding='utf-8').write('\n')
    print(f'合并完成: 新增版本记录 {added_v} 条, 新增 successor {added_s} 条, 跳过 {skipped} 条')

if __name__ == '__main__':
    main()
