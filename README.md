# 缝合兽制造机

左边抽一种生物，右边抽一件东西，把两个 3D 模型切开再缝成一只新怪兽。默认是老虎机随机抽，也可以自己挑。两边各 20 个原型，共 400 种配对。

纯静态页面，没有构建步骤。本地运行：在本目录执行 `python3 -m http.server`，然后打开 http://localhost:8000 。

- `js/data.js` 两边的原型清单、摆放参数和文案
- `js/fusion.js` 缝合：切割、接口收放、封口、布套
- `js/main.js` 界面、卷轴、舞台演出、音效
- `models/*.glb` 模型原件；`models/*.glb.js` 是页面实际载入的文本版，改了模型后运行 `python3 tools/pack.py` 重新生成

## 素材出处

40 个模型全部来自 [Poly Pizza](https://poly.pizza)。标 CC-BY 3.0 的按[授权要求](https://creativecommons.org/licenses/by/3.0/)署名如下，CC0 的一并列出。为了减小体积，部分模型的贴图缩小过；缝合时模型会被切开重组。

| 原型 | 模型 | 作者 | 授权 |
| --- | --- | --- | --- |
| 老虎 | [Tiger](https://poly.pizza/m/5A3w06FXUup) | Poly by Google | CC-BY 3.0 |
| 鲨鱼 | [Shark](https://poly.pizza/m/8Ke5qCnWxsZ) | Poly by Google | CC-BY 3.0 |
| 章鱼 | [Octopus](https://poly.pizza/m/9-b6-yqrwEe) | Poly by Google | CC-BY 3.0 |
| 老鹰 | [Eagle](https://poly.pizza/m/d7CSLvsHULY) | Poly by Google | CC-BY 3.0 |
| 螃蟹 | [Crab](https://poly.pizza/m/2DgM36qZW2u) | Poly by Google | CC-BY 3.0 |
| 仙人掌 | [Cactus](https://poly.pizza/m/1_3Ur2-LAs8) | Poly by Google | CC-BY 3.0 |
| 霸王龙 | [T-Rex](https://poly.pizza/m/9GyZw9gGPMq) | Poly by Google | CC-BY 3.0 |
| 蘑菇 | [Mushroom](https://poly.pizza/m/2DAaKHD48ZP) | jeremy | CC-BY 3.0 |
| 大象 | [Elephant](https://poly.pizza/m/cx0-TiCjDOx) | Poly by Google | CC-BY 3.0 |
| 向日葵 | [Sunflower](https://poly.pizza/m/ce4GXw3VYE5) | Poly by Google | CC-BY 3.0 |
| 长颈鹿 | [Giraffe](https://poly.pizza/m/80w8kwQU0QH) | Poly by Google | CC-BY 3.0 |
| 企鹅 | [Penguin](https://poly.pizza/m/fBXvsC6pe_V) | Poly by Google | CC-BY 3.0 |
| 青蛙 | [Frog](https://poly.pizza/m/0QZHgL_V-Pj) | Poly by Google | CC-BY 3.0 |
| 奶牛 | [Cow](https://poly.pizza/m/0OToIgkcVM7) | Poly by Google | CC-BY 3.0 |
| 公鸡 | [Rooster](https://poly.pizza/m/6NTegstc5Jy) | Poly by Google | CC-BY 3.0 |
| 眼镜蛇 | [Cobra](https://poly.pizza/m/40_5Xq467-U) | Poly by Google | CC-BY 3.0 |
| 乌龟 | [Turtle](https://poly.pizza/m/2LCcq8vhqJ3) | Poly by Google | CC-BY 3.0 |
| 蜜蜂 | [Bee](https://poly.pizza/m/2177F_NMT--) | Poly by Google | CC-BY 3.0 |
| 熊猫 | [Panda](https://poly.pizza/m/2T6A0o4Kq2h) | Poly by Google | CC-BY 3.0 |
| 蜗牛 | [Snail](https://poly.pizza/m/aZ_cT-AIu2y) | Poly by Google | CC-BY 3.0 |
| 电风扇 | [Window fan](https://poly.pizza/m/07cXAzjS23K) | Poly by Google | CC-BY 3.0 |
| 火车 | [Train](https://poly.pizza/m/fm-ioGYuEhx) | Poly by Google | CC-BY 3.0 |
| 飞机 | [Airplane](https://poly.pizza/m/8ciDd9k8wha) | Poly by Google | CC-BY 3.0 |
| 手机 | [Phone](https://poly.pizza/m/k2kgBepoMU) | Quaternius | CC0 1.0 |
| 电脑 | [Computer](https://poly.pizza/m/2EHvZLax4Y3) | Poly by Google | CC-BY 3.0 |
| 电视机 | [Featured Content](https://poly.pizza/m/4r2K0MtyBFF) | Kell Condon | CC-BY 3.0 |
| 火箭 | [Rocketship](https://poly.pizza/m/8iKIYCyvh2k) | Poly by Google | CC-BY 3.0 |
| 坦克 | [Tank](https://poly.pizza/m/4t0RMXCl_Ud) | Poly by Google | CC-BY 3.0 |
| 电吉他 | [Electric guitar](https://poly.pizza/m/eoSib2-NN9Y) | Poly by Google | CC-BY 3.0 |
| 马桶 | [Toilet](https://poly.pizza/m/WAu50yGFVt) | Quaternius | CC0 1.0 |
| 汽车 | [Car](https://poly.pizza/m/75h3mi6uHuC) | Poly by Google | CC-BY 3.0 |
| 直升机 | [Helicopter](https://poly.pizza/m/cTzINMr0WdS) | Poly by Google | CC-BY 3.0 |
| 潜水艇 | [Submarine](https://poly.pizza/m/7-3Vgg6rR4j) | Poly by Google | CC-BY 3.0 |
| 洗衣机 | [Washing Machine](https://poly.pizza/m/UFxsKNSl8W) | Quaternius | CC0 1.0 |
| 冰箱 | [Fridge](https://poly.pizza/m/3NYolcXB1o) | Quaternius | CC0 1.0 |
| 钢琴 | [Piano](https://poly.pizza/m/1YoE664mJTd) | Poly by Google | CC-BY 3.0 |
| 推土机 | [Bulldozer](https://poly.pizza/m/ddxtaegI3HQ) | Poly by Google | CC-BY 3.0 |
| 热气球 | [Hot air balloon](https://poly.pizza/m/8azSIUgP0ow) | Poly by Google | CC-BY 3.0 |
| 飞碟 | [Flying saucer](https://poly.pizza/m/b0N_HeT_Ttb) | Poly by Google | CC-BY 3.0 |
| 摩托车 | [Motorcycle](https://poly.pizza/m/dse64pqMKAR) | Poly by Google | CC-BY 3.0 |
