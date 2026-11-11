"""Oracle: run the Python SonyRecallColor codec on fixed cases; TS must match byte-for-byte (scripts/parity.ts)."""
import json, sys, pathlib
HERE = pathlib.Path(__file__).resolve().parent.parent
SRC = pathlib.Path('/home/thaikpham/Downloads/ZVE10_DAT_DECODE/SonyRecallColor')
sys.path.insert(0, str(SRC))
import zve10_dat as dat
bundle = json.load(open(HERE/'lib/zve10/profile.json'))
profile = dat.with_supplement(bundle['profile'], bundle['supplement'])
focus_profile = bundle['focus']
presets = json.load(open(HERE/'test/fixtures/parity-recipes.json'))
base = (HERE/'test/fixtures/dot6/CAMPR04N.DAT').read_bytes()
P = lambda i: {'pp': presets[i]['pp'], 'wb': presets[i]['wb'], 'unsupported': []}
custom = {'gamma': 'Cine1', 'color_mode': 'Pro', 'black_level': -15, 'black_gamma_range': 'Narrow',
          'black_gamma_level': 7, 'knee_mode': 'Manual', 'knee_auto_max': 95, 'knee_auto_sens': 'High',
          'knee_point': 80, 'knee_slope': -5, 'saturation': -32, 'color_phase': 7, 'depth_r': 7,
          'depth_g': -7, 'depth_b': 6, 'depth_c': -6, 'depth_m': 5, 'depth_y': -5, 'detail_level': -7,
          'detail_mode': 'Manual', 'detail_vh': 2, 'detail_bw': 'Type4', 'detail_limit': 7,
          'detail_crisp': 7, 'detail_hilight': 4}
K = lambda a='keep', s='keep', i='keep': {'aperture': a, 'shutter': s, 'iso': i}
cases = [
 ('c01', P(0), P(0)['wb'], 'M', 'keep', K()),
 ('c02', P(1), {'mode':'ctemp','kelvin':3600,'ab':7,'gm':1,'priority':'standard'}, 'A', 'AF-C', K('2.8','keep','AUTO')),
 ('c03', P(2), {'mode':'awb','kelvin':5600,'ab':0.5,'gm':0,'priority':'ambience'}, 'P', 'MF', K('keep','1/125','800')),
 ('c04', P(3), {'mode':'awb','kelvin':5600,'ab':0,'gm':0,'priority':'white'}, 'S', 'AF-S', K('16','30"','51200')),
 ('c05', P(4), {'mode':'ctemp','kelvin':9900,'ab':-7,'gm':-7,'priority':'standard'}, 'M', 'AF-C', K('1.0','1/4000','100')),
 ('c06', {'pp': custom, 'wb': {}, 'unsupported': []}, {'mode':'ctemp','kelvin':5600,'ab':2.5,'gm':0.75,'priority':'standard'}, 'A', 'keep', K('5.6','0.4"','AUTO')),
 ('c07', P(5), {'mode':'ctemp','kelvin':4300,'ab':0,'gm':0,'priority':'standard'}, 'M', 'keep', K()),
 ('c08', P(6), {'mode':'awb','kelvin':5600,'ab':-3,'gm':2,'priority':'standard'}, 'M', 'AF-S', K('8','1/60','400')),
]
out = []
for name, recipe, wb, mode, foc, exp in cases:
    try:
        res = dat.apply(base, recipe, wb, mode, profile, foc, focus_profile, exp)
    except Exception as e:
        print(name, 'PY-REJECT:', str(e).replace('\n',' | ')); continue
    pathlib.Path('/tmp/parity/py/%s.dat' % name).write_bytes(res)
    out.append({'name': name, 'pp': recipe['pp'], 'wb': wb, 'mode': mode, 'focus': foc, 'exposure': exp})
    print(name, 'ok')
json.dump(out, open('/tmp/parity/cases.json', 'w'))
