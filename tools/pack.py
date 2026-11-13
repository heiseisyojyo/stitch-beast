# 把 models/*.glb 打包成 models/<id>.glb.js（base64 文本）。页面用 <script> 载入这些文件，
# 这样既能发布到只收文本类文件的地方，本地直接打开也能跑。改了模型之后重跑一遍：python3 tools/pack.py
import base64, glob, os

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'models')
total = 0
for p in sorted(glob.glob(os.path.join(root, '*.glb'))):
    name = os.path.basename(p)[:-4]
    b64 = base64.b64encode(open(p, 'rb').read()).decode()
    out = p + '.js'
    open(out, 'w').write('(window.MODEL_B64=window.MODEL_B64||{})["%s"]="%s";\n' % (name, b64))
    total += os.path.getsize(out)
print('packed', len(glob.glob(os.path.join(root, '*.glb.js'))), 'files,', round(total / 1e6, 2), 'MB')
