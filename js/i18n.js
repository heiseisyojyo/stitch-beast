'use strict';
/* i18n.js：中文 / English / 日本語。
   语言按浏览器（设备）的语言偏好列表自动选：zh* → 中文，ja* → 日语，其余 → 英语；手动切换过就记住。
   界面文字在 ui 里；原型的名字和档案文案，中文写在 data.js，英文和日文在这里按 id 覆盖。
   各语言的文案条数保持一致（pre 3 条，其余 2 条），这样同一个种子在三种语言下抽到的是同一条。 */
const I18N = {
  zh: {
    code: 'zh-CN', tag: '中',
    suffix: [['怪', '兽'], ['兽', '怪'], ['兽', '王'], ['王', '皇'], ['皇', '神']],
    fmt: {
      name: (p, s, x) => p + s + x, epithet: (b, a) => b + '的' + a, home: (a, b) => a + '的' + b, skill: (b, a) => b + '·' + a,
      lore: (a, b) => a + '，' + b + '。', height: h => h + ' 米', weight: w => w + ' 万吨',
    },
    kind: { head: '换头', half: '拦腰对接', sandwich: '三段夹心', rider: '背上嫁接', wear: '整件当头', carry: '背在背上', tailprop: '尾部推进', topper: '头顶螺旋桨', hang: '气囊吊着', beam: '光束吸走' },
    parts: { head: '头', body: '身体', half1: '这一半', half2: '那一半', waist: '腰', tail: '尾', back: '背上', tailp: '尾巴上', top: '头顶', above: '上方', eyes: '眼睛', eyesVal: '后配的' },
    stats: ['破坏力', '速度', '装甲', '离谱度'],
    ui: {
      title: '缝合兽制造机', mode: '玩法', tabSlot: '老虎机', tabCustom: '自定义', dex: '图鉴', snd: '音效', credits: '素材出处', lang: '切换语言',
      stage: '合体舞台', loading: '正在搬运素材', loadFail: '素材没能载入，刷新页面再试一次。', hint: '拖动转一转，滚轮拉远近', sheet: '看档案', sheetX: '收起',
      console: '操作台', labelA: '生物', labelB: '东西', pickA: '挑一种生物', pickB: '挑一件东西', prevA: '上一种生物', nextA: '下一种生物', prevB: '上一件东西', nextB: '下一件东西',
      go: '拉杆！', goCustom: '合体！', reroll: '换个缝法', card: '怪兽档案', close: '关闭',
      dexTitle: '图鉴', dexSub: (n, all) => `已缝出 ${n} 种，共 ${all} 种配对`, dexEmpty: '还没有缝出过怪兽。拉一下拉杆，缝出来的会记在这里。',
      creditTitle: '素材出处', groupA: '生物', groupB: '物件', modelPage: '模型页',
      creditBody: '40 个 3D 模型全部来自 <a href="https://poly.pizza" target="_blank" rel="noopener">Poly Pizza</a>。标 CC-BY 3.0 的按<a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">授权要求</a>署名，CC0 的一并列出。为了减小体积，部分模型的贴图缩小过；缝合时模型会被切开重组。',
      nogl: '这台机器要用 WebGL 画 3D 模型，当前浏览器没能启动它。换一个浏览器或打开硬件加速再试。',
      appears: no => no + ' 登场', danger: n => `危险度 ${n} 星`, fHeight: '身高', fWeight: '体重', fHome: '出身地', fSkill: '必杀技', fWeak: '弱点',
      recipe: '缝合配方', power: '战力', report: '目击报告', max: '爆表',
      share: '分享', saveImg: '生成图片', imgTitle: '怪兽卡片', imgHint: '长按或右键图片也能保存。', download: '下载图片', copied: '链接已复制', shareText: n => `我缝出了「${n}」！`,
    },
  },

  en: {
    code: 'en', tag: 'EN',
    suffix: [['', ' Jr.'], ['', ' Beast'], [' King', ' Lord'], [' Overlord', ' Emperor'], [' God', ' Almighty']],
    fmt: {
      name: (p, s, x) => p + ' ' + s + x, epithet: (b, a) => 'The ' + b + ' ' + a, home: (a, b) => b + ', ' + a, skill: (b, a) => b + ' · ' + a,
      lore: (a, b) => 'It ' + a + ', and ' + b + '.', height: h => h + ' m', weight: w => Math.round(w * 10000).toLocaleString('en-US') + ' t',
    },
    kind: { head: 'Head swap', half: 'Half and half', sandwich: 'Three-layer sandwich', rider: 'Back graft', wear: 'Whole thing as head', carry: 'Strapped on its back', tailprop: 'Tail thruster', topper: 'Rotor on its head', hang: 'Hung from the balloon', beam: 'Caught in the beam' },
    parts: { head: 'Head', body: 'Body', half1: 'This half', half2: 'That half', waist: 'Middle', tail: 'Tail', back: 'On its back', tailp: 'On its tail', top: 'On its head', above: 'Overhead', eyes: 'Eyes', eyesVal: 'added later' },
    stats: ['Power', 'Speed', 'Armor', 'Absurdity'],
    ui: {
      title: 'Kaiju Stitcher', mode: 'Mode', tabSlot: 'Slots', tabCustom: 'Custom', dex: 'Dex', snd: 'Sound', credits: 'Credits', lang: 'Change language',
      stage: 'Fusion stage', loading: 'Loading models', loadFail: 'The models failed to load. Refresh the page to try again.', hint: 'Drag to rotate, scroll to zoom', sheet: 'View file', sheetX: 'Close',
      console: 'Controls', labelA: 'Creature', labelB: 'Thing', pickA: 'Pick a creature', pickB: 'Pick a thing', prevA: 'Previous creature', nextA: 'Next creature', prevB: 'Previous thing', nextB: 'Next thing',
      go: 'Pull!', goCustom: 'Fuse!', reroll: 'Restitch', card: 'Kaiju file', close: 'Close',
      dexTitle: 'Dex', dexSub: (n, all) => `${n} of ${all} pairings stitched`, dexEmpty: 'Nothing stitched yet. Pull the lever and every kaiju you make will be recorded here.',
      creditTitle: 'Credits', groupA: 'Creatures', groupB: 'Things', modelPage: 'Model page',
      creditBody: 'All 40 3D models come from <a href="https://poly.pizza" target="_blank" rel="noopener">Poly Pizza</a>. Models marked CC-BY 3.0 are credited here as <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">the license requires</a>; CC0 models are listed too. Some textures were downscaled to save space, and models are cut up and recombined when stitched.',
      nogl: 'This machine draws its 3D models with WebGL, and this browser could not start it. Try another browser or turn on hardware acceleration.',
      appears: no => no + ' appears!', danger: n => `Danger level ${n} of 5`, fHeight: 'Height', fWeight: 'Weight', fHome: 'Origin', fSkill: 'Finisher', fWeak: 'Weakness',
      recipe: 'Stitching recipe', power: 'Stats', report: 'Eyewitness report', max: 'MAX',
      share: 'Share', saveImg: 'Make image', imgTitle: 'Kaiju card', imgHint: 'You can also long-press or right-click the image to save it.', download: 'Download', copied: 'Link copied', shareText: n => `I stitched up ${n}!`,
    },
    bio: {
      tiger: { name: 'Tiger', short: 'Tiger', home: 'deep in the Bengal rainforest', atk: ['Pouncing Tiger', 'King-of-Beasts Roar'], epi: ['Jungle Tyrant', 'Lord of the Mountain'], habit: ['sleeps sixteen hours a day', 'patrols its turf daily and claws every tree it passes'] },
      shark: { name: 'Shark', short: 'Shark', home: 'at the bottom of a Pacific trench', atk: ['Deep-Sea Chomp', 'Blood-Scent Rush'], epi: ['Deep-Sea Killer', 'Trench Overlord'], habit: ['can smell a single drop of blood from a kilometer away', 'runs out of breath the moment it stops swimming'] },
      octopus: { name: 'Octopus', short: 'Octo', home: 'in a coral reef cave', atk: ['Eight-Arm Squeeze', 'Ink Smokescreen'], epi: ['Eight-Armed Sage', 'Ink Master'], habit: ['has three hearts and nine brains', 'unscrews jar lids to break out of aquariums'] },
      eagle: { name: 'Eagle', short: 'Eagle', home: 'on a cliff in the Rockies', atk: ['Dive-Bomb Talons', 'Eagle-Eye Lock-On'], epi: ['Sky Hunter', 'King of the Cliffs'], habit: ['can spot a rabbit from three kilometers away', 'goes back to renovate the same nest every year'] },
      crab: { name: 'Crab', short: 'Crab', home: 'on a mudflat at low tide', atk: ['Giant Pincer Crush', 'Sideways Rampage'], epi: ['Sideways General', 'Mudflat Bully'], habit: ['has never walked a straight line in its life', 'hides for three days out of shyness every time it molts'] },
      cactus: { name: 'Cactus', short: 'Cactus', home: 'in the Sonoran Desert', atk: ['Thousand-Needle Storm', 'Desert Hug'], epi: ['Desert Assassin', 'Prickly Hermit'], habit: ['drinks water only once a year', 'pricks anyone who comes close, friends included'] },
      trex: { name: 'T. rex', short: 'Rex', home: 'on a Cretaceous fern plain', atk: ['World-Ending Bite', 'Earth Stomp'], epi: ['Cretaceous Tyrant', 'Extinction Survivor'], habit: ['cannot reach its own back and has always been touchy about it', 'can bite a compact car in half'] },
      mushroom: { name: 'Mushroom', short: 'Shroom', home: 'in a pine forest after rain', atk: ['Spore Storm', 'Trippy Fungal Mist'], epi: ['Forest Poisoner', 'After-Rain Assassin'], habit: ['pops up overnight after it rains', 'gets worse-tempered the brighter its colors are'] },
      elephant: { name: 'Elephant', short: 'Elephant', home: 'on the African savanna', atk: ['Ten-Thousand-Ton Stomp', 'Trunk Tornado'], epi: ['Savanna Colossus', 'Long-Nosed Sage'], habit: ['remembers everyone who wronged it thirty years ago', 'is secretly terrified of bees'] },
      sunflower: { name: 'Sunflower', short: 'Sunflower', home: 'on a sunny hillside in midsummer', atk: ['Solar Cannon', 'Sunflower-Seed Machine Gun'], epi: ['Sun Chaser', 'Seed Factory'], habit: ['keeps its face turned to the sun all day', 'grows two thousand seeds on a single face'] },
      giraffe: { name: 'Giraffe', short: 'Giraffe', home: 'in an East African acacia grove', atk: ['Sky-High Headbutt', 'Look-Down Stare'], epi: ['Cloud-Level Diner', 'Longest Neck in Town'], habit: ['sleeps only half an hour a day', 'has to do the splits just to drink water'] },
      penguin: { name: 'Penguin', short: 'Penguin', home: 'on an Antarctic ice floe', atk: ['Belly-Slide Tackle', 'Ice Rink Rampage'], epi: ['Antarctic Gentleman', 'Ice Slider'], habit: ['waddles when it walks but outslides everyone', 'wears a tuxedo all year round'] },
      frog: { name: 'Frog', short: 'Frog', home: 'on a lotus leaf after rain', atk: ['Tongue-Snap Ambush', 'Chain Leapfrog'], epi: ['Pond Idol', 'Lily Pad Boss'], habit: ['shoots its tongue out faster than you can blink', 'holds all-night concerts whenever it rains'] },
      cow: { name: 'Cow', short: 'Cow', home: 'on an Alpine pasture', atk: ['Raging Bull Charge', 'Milk Fountain'], epi: ['Walking Milk Tank', 'Cud-Chewing Master'], habit: ['has four stomachs and spends eight hours chewing one meal', 'produces twenty-five liters of milk a day'] },
      rooster: { name: 'Rooster', short: 'Rooster', home: 'by the haystack at the village gate', atk: ['Crack-of-Dawn Crow', 'Rapid-Fire Peck'], epi: ['Dawn Bugler', 'Village Bully'], habit: ['wakes everyone up at four a.m. sharp', 'picks a fight with its own reflection'] },
      cobra: { name: 'Cobra', short: 'Cobra', home: 'in the tall grass by the Ganges', atk: ['Venom Spit', 'Death Stare'], epi: ['Grassland Assassin', 'Snake-Charmer Sidekick'], habit: ['flares its neck into a fan when angry', 'smells things by flicking its tongue'] },
      turtle: { name: 'Turtle', short: 'Turtle', home: 'on a Galápagos beach', atk: ['Shell Slam', 'Head-Tuck Defense'], epi: ['Century-Old Elder', 'Slowpoke Champion'], habit: ['can live a hundred and fifty years, so it never hurries', 'pulls its head in at the slightest noise'] },
      bee: { name: 'Bee', short: 'Bee', home: 'above a field of canola blossoms', atk: ['Stinger Thrust', 'Waggle-Dance Navigation'], epi: ['Flower-Field Workaholic', 'Hive Guardian'], habit: ['tells its friends where the flowers are by dancing', 'makes just one teaspoon of honey in its whole life'] },
      panda: { name: 'Panda', short: 'Panda', home: 'in a Sichuan bamboo forest', atk: ['Panda Roll', 'Bamboo Pole Sweep'], epi: ['Bamboo Hermit', 'Dark-Circled National Treasure'], habit: ['spends fourteen hours a day eating bamboo', 'wins fights mostly by rolling over'] },
      snail: { name: 'Snail', short: 'Snail', home: 'on a cabbage leaf after rain', atk: ['Slime Trap', 'Shell Lockdown'], epi: ['House Carrier', 'Legend of Slowness'], habit: ['carries its house everywhere it goes', 'covers eight centimeters a minute at top speed'] },
    },
    mech: {
      fan: { name: 'Electric Fan', pre: ['Turbo', 'Oscillating', 'High-Speed'], place: 'A second-hand appliance market', atk: ['Max-Speed Gale', 'Oscillating Sweep'], epi: ['Never-Stopping', 'Summer-Saving'], quirk: ['starts shaking its head side to side when nervous', 'gets so loud on high that nobody can hear it roar'], weak: 'Someone pulling the plug' },
      train: { name: 'Train', pre: ['Steam', 'Express', 'Freight'], place: 'An abandoned rail yard', atk: ['Steam Ram', 'Full-Speed Arrival'], epi: ['Always-on-Time', 'Choo-Chooing'], quirk: ['toots its whistle and smokes from the head when excited', 'cannot really turn without rails'], weak: 'A forty-minute delay' },
      plane: { name: 'Airplane', pre: ['Jet', 'Supersonic', 'Jumbo'], place: 'An airport baggage carousel', atk: ['Dive Bombing', 'Sonic Boom'], epi: ['High-Altitude', 'Never-Landing'], quirk: ['needs a two-kilometer run-up before takeoff', 'expects applause every time it lands'], weak: 'Air traffic control' },
      phone: { name: 'Phone', pre: ['5G', 'Cracked-Screen', 'Full-Bars'], place: 'A phone repair stall', atk: ['99+ Unread Barrage', 'Forced Face Unlock'], epi: ['Always-Online', 'Left-on-Read'], quirk: ['gets anxious when its battery drops below 20%', 'lights up every three minutes to check for new messages'], weak: 'One bar of signal' },
      pc: { name: 'Computer', pre: ['Blue-Screen', 'Frozen', 'Clicky-Keyboard'], place: 'The back corner of an internet café', atk: ['Blue Screen Stare', 'Forced Restart'], epi: ['Currently-Updating', 'Not-Responding'], quirk: ['pops up "Updating, do not turn off" at every critical moment', 'starts wheezing with three browser tabs open'], weak: 'An update stuck at 37%' },
      tv: { name: 'TV', pre: ['Static', 'Cathode-Ray', 'Remote-Controlled'], place: 'Grandma\'s living room', atk: ['Static Hypnosis', 'Nonstop Commercials'], epi: ['Back-After-the-Break', 'Never-Changing-Channel'], quirk: ['works fine again after a couple of smacks', 'cuts to commercials right at the good part'], weak: 'Mom calling everyone to dinner' },
      rocket: { name: 'Rocket', pre: ['Moonshot', 'Booster', 'Second-Stage'], place: 'The scrap heap at a launch site', atk: ['Ignition Liftoff', 'Escape-Tower Eject'], epi: ['One-Way', 'Escape-Velocity'], quirk: ['counts down from ten before leaving the house', 'shoots fire from its rear when in a hurry'], weak: 'A scrubbed launch window' },
      tank: { name: 'Tank', pre: ['Armored', 'Tracked', 'Heavy-Cannon'], place: 'The backyard of a military museum', atk: ['Main Gun Salvo', 'Tread Crusher'], epi: ['Bulletproof', 'Steel-Plated'], quirk: ['has to pivot on the spot just to turn around', 'leaves every road it takes in need of repaving'], weak: 'Rising fuel prices' },
      guitar: { name: 'Guitar', pre: ['Rock', 'Distortion', 'Heavy-Metal'], place: 'A basement rehearsal room', atk: ['Wall of Distortion', 'Screaming Bend'], epi: ['Turned-Up-to-Eleven', 'Never-Tuned'], quirk: ['adds echo and distortion to every step it takes', 'cannot speak properly unless it is plugged in'], weak: 'The neighbors calling the cops' },
      toilet: { name: 'Toilet', pre: ['Flushing', 'Siphon', 'Smart'], place: 'A third-floor mall restroom', atk: ['Siphon Vortex', 'Flush Tsunami'], epi: ['All-Accepting', 'Bottomless'], quirk: ['has to flush loudly after every meal', 'gives anyone who sits on it in winter an icy shock'], weak: 'The water being shut off' },
      car: { name: 'Car', pre: ['Turbocharged', 'Stick-Shift', 'Four-Wheel-Drive'], place: 'A used-car lot', atk: ['Launch Start', 'High-Beam Flash'], epi: ['Pedal-to-the-Metal', 'Forever-in-Traffic'], quirk: ['wants to overtake everything once it hits the highway', 'needs a drink of oil every five thousand kilometers'], weak: 'Morning rush hour' },
      heli: { name: 'Helicopter', pre: ['Rotor', 'Hovering', 'Gunship'], place: 'A hospital rooftop helipad', atk: ['Rotor Slash', 'Hover Strafe'], epi: ['Vertical-Takeoff', 'Wind-Whipping'], quirk: ['spins on the spot and lifts off when happy', 'can be heard three kilometers away'], weak: 'Windy weather' },
      sub: { name: 'Submarine', pre: ['Deep-Dive', 'Sonar', 'Nuclear'], place: 'A naval dry dock', atk: ['Torpedo Salvo', 'Sonar Shockwave'], epi: ['Deep-Lurking', 'Silent-Running'], quirk: ['dives without a word whenever there is trouble', 'finds its way by listening to echoes'], weak: 'Having to surface for air' },
      moto: { name: 'Motorbike', pre: ['Biker', 'Knee-Dragging', 'Tailpipe'], place: 'A ring road at midnight', atk: ['Drift Tail-Whip', 'Tailpipe Roar'], epi: ['Midnight-Racing', 'Ground-Hugging'], quirk: ['likes to scrape its knee on the ground in corners', 'revs its engine in the middle of the night'], weak: 'Slippery roads on rainy days' },
      washer: { name: 'Washer', pre: ['Front-Load', 'Spin-Dry', 'Tumbling'], place: 'A college dorm laundry room', atk: ['Drum Storm', 'High-Speed Spin Cycle'], epi: ['Ever-Spinning', 'Sock-Eating'], quirk: ['secretly eats one sock every time', 'runs around the room during the spin cycle'], weak: 'Being overloaded' },
      fridge: { name: 'Fridge', pre: ['Deep-Freeze', 'Fresh-Keeping', 'Double-Door'], place: 'A shared-flat kitchen', atk: ['Flash-Freeze Breath', 'Cold Storage Lockup'], epi: ['Glowing-at-Midnight', 'Leftover-Stuffed'], quirk: ['gets its door opened by someone every midnight', 'hides three-year-old leftovers in its belly'], weak: 'Its door being left open' },
      piano: { name: 'Piano', pre: ['88-Key', 'Out-of-Tune', 'Recital'], place: 'A music-school practice room', atk: ['Fortissimo Bombing', '88-Key Barrage'], epi: ['Exam-Nightmare', 'Black-and-White'], quirk: ['goes out of tune when nervous', 'echoes for a long time when you step on its foot'], weak: 'Being moved up six flights of stairs' },
      dozer: { name: 'Bulldozer', pre: ['Bulldozing', 'Demolition', 'Flattening'], place: 'A construction site in the old quarter', atk: ['Flatten Everything', 'Tread Crusher'], epi: ['Building-Toppling', 'Construction-Site'], quirk: ['wants to flatten anything that is not level', 'can only go in a straight line'], weak: 'One stubborn homeowner' },
      balloon: { name: 'Balloon', pre: ['Hot-Air', 'Floating', 'Inflatable'], place: 'The sky above a Turkish valley', atk: ['Hot Air Breath', 'High-Altitude Sandbag Drop'], epi: ['Wind-Drifting', 'Full-of-Hot-Air'], quirk: ['goes wherever the wind blows', 'lands on the spot the moment it deflates'], weak: 'A single pinprick' },
      ufo: { name: 'UFO', pre: ['Alien', 'Anti-Gravity', 'Tractor-Beam'], place: 'A hangar at Area 51', atk: ['Tractor Beam', 'Crop Circle'], epi: ['Unidentified', 'Cow-Abducting'], quirk: ['likes to beam cows into the sky at night', 'is always blurry in photos'], weak: 'A clear photo of it' },
    },
  },

  ja: {
    code: 'ja', tag: '日',
    suffix: [['', 'モドキ'], ['', 'ジュニア'], ['キング', 'ロード'], ['大王', 'エンペラー'], ['神', '大魔王']],
    fmt: {
      name: (p, s, x) => p + s + x, epithet: (b, a) => b + a, home: (a, b) => a + 'の' + b, skill: (b, a) => b + '・' + a,
      lore: (a, b) => a + '。' + b + '。', height: h => h + ' m', weight: w => w + ' 万トン',
    },
    kind: { head: '頭のすげかえ', half: '胴体つなぎ', sandwich: '三段サンド', rider: '背中に接ぎ木', wear: 'まるごと頭に', carry: '背中にしょう', tailprop: 'しっぽにプロペラ', topper: '頭にローター', hang: '気球でつり下げ', beam: 'ビームで吸い上げ' },
    parts: { head: '頭', body: '体', half1: 'こっち半分', half2: 'あっち半分', waist: '腰', tail: 'しっぽ', back: '背中', tailp: 'しっぽ', top: '頭の上', above: '上空', eyes: '目', eyesVal: 'あとづけ' },
    stats: ['破壊力', 'スピード', '装甲', 'デタラメ度'],
    ui: {
      title: 'ツギハギ怪獣メーカー', mode: '遊びかた', tabSlot: 'スロット', tabCustom: 'カスタム', dex: '図鑑', snd: 'サウンド', credits: 'クレジット', lang: '言語を切り替える',
      stage: '合体ステージ', loading: '素材を搬入中', loadFail: '素材を読み込めませんでした。ページを再読み込みしてください。', hint: 'ドラッグで回転、ホイールで拡大', sheet: 'データを見る', sheetX: 'とじる',
      console: '操作パネル', labelA: '生き物', labelB: 'モノ', pickA: '生き物をえらぶ', pickB: 'モノをえらぶ', prevA: '前の生き物', nextA: '次の生き物', prevB: '前のモノ', nextB: '次のモノ',
      go: 'まわす！', goCustom: '合体！', reroll: '縫いなおす', card: '怪獣データ', close: 'とじる',
      dexTitle: '図鑑', dexSub: (n, all) => `全${all}通りのうち${n}体を縫合ずみ`, dexEmpty: 'まだ1体も縫っていません。スロットをまわすと、できた怪獣がここに記録されます。',
      creditTitle: '素材クレジット', groupA: '生き物', groupB: 'モノ', modelPage: 'モデルのページ',
      creditBody: '40体の3Dモデルはすべて <a href="https://poly.pizza" target="_blank" rel="noopener">Poly Pizza</a> のものです。CC-BY 3.0 のモデルは<a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">ライセンスの条件</a>にしたがってここにクレジットを記載し、CC0 のモデルもあわせて載せています。容量を減らすため一部のテクスチャを縮小しています。縫合のとき、モデルは切り分けて組みなおされます。',
      nogl: 'このマシンは WebGL で3Dモデルを描きますが、このブラウザでは起動できませんでした。別のブラウザを使うか、ハードウェアアクセラレーションを有効にしてください。',
      appears: no => no + ' 登場', danger: n => `危険度 ${n}`, fHeight: '身長', fWeight: '体重', fHome: '出身地', fSkill: '必殺技', fWeak: '弱点',
      recipe: '縫合レシピ', power: '戦闘力', report: '目撃情報', max: '測定不能',
      share: 'シェア', saveImg: '画像にする', imgTitle: '怪獣カード', imgHint: '画像を長押し（または右クリック）しても保存できます。', download: 'ダウンロード', copied: 'リンクをコピーしました', shareText: n => `「${n}」を縫い上げた！`,
    },
    bio: {
      tiger: { name: 'トラ', short: 'タイガー', home: 'ベンガルの密林の奥', atk: ['猛虎落とし', '百獣の咆哮'], epi: ['密林の暴君', '山の大将'], habit: ['1日に16時間は寝ている', '毎日なわばりを見回り、木という木に爪あとを残す'] },
      shark: { name: 'サメ', short: 'シャーク', home: '太平洋の海溝', atk: ['深海かみつき', '血のにおいダッシュ'], epi: ['深海の殺し屋', '海溝の覇者'], habit: ['1キロ先の血1滴をかぎつける', '泳ぎを止めると息が苦しくなる'] },
      octopus: { name: 'タコ', short: 'オクト', home: 'サンゴ礁の洞くつ', atk: ['八本足しめつけ', 'スミ煙幕'], epi: ['八本足の賢者', 'スミの達人'], habit: ['心臓が3つ、脳が9つある', 'ビンのふたを回して開け、水族館から脱走する'] },
      eagle: { name: 'ワシ', short: 'イーグル', home: 'ロッキー山脈の断崖', atk: ['急降下クロー', '千里眼ロックオン'], epi: ['大空の狩人', '断崖の王'], habit: ['3キロ先のウサギが見える', '毎年おなじ巣に戻ってリフォームする'] },
      crab: { name: 'カニ', short: 'カニ', home: '潮の引いた干潟', atk: ['巨大ハサミつぶし', '横歩き大暴れ'], epi: ['横歩きの将軍', '干潟のガキ大将'], habit: ['生まれてから一度もまっすぐ歩いたことがない', '脱皮するたびに恥ずかしがって3日かくれる'] },
      cactus: { name: 'サボテン', short: 'サボテン', home: 'ソノラ砂漠', atk: ['千本針の嵐', '砂漠のハグ'], epi: ['砂漠の刺客', 'トゲだらけの隠者'], habit: ['水を飲むのは1年に1回だけ', '近づく者は友だちでも刺す'] },
      trex: { name: 'ティラノ', short: 'レックス', home: '白亜紀のシダの平原', atk: ['世界滅亡バイト', '大地ふみつけ'], epi: ['白亜紀の暴君', '絶滅の生き残り'], habit: ['自分の背中に手が届かないのをずっと気にしている', 'ひとかみで軽自動車をかみ砕く'] },
      mushroom: { name: 'キノコ', short: 'キノコ', home: '雨あがりの松林', atk: ['胞子ストーム', '幻覚きのこミスト'], epi: ['森の毒使い', '雨あがりの刺客'], habit: ['雨が降ると一晩で生えてくる', '色があざやかなほど性格がわるい'] },
      elephant: { name: 'ゾウ', short: 'エレファント', home: 'アフリカのサバンナ', atk: ['一万トンふみつけ', '長鼻トルネード'], epi: ['サバンナの巨神', '長い鼻の賢者'], habit: ['30年前にいじめてきた相手を全員おぼえている', 'じつはハチがものすごく怖い'] },
      sunflower: { name: 'ヒマワリ', short: 'ヒマワリ', home: '真夏の日なたの丘', atk: ['ソーラーキャノン', 'タネマシンガン'], epi: ['太陽の追っかけ', 'タネ工場'], habit: ['顔がいつも太陽のほうを向いている', '顔1つにタネが2000粒できる'] },
      giraffe: { name: 'キリン', short: 'キリン', home: '東アフリカのアカシア林', atk: ['上空ヘッドバット', '高みの見下ろし'], epi: ['雲の上の食いしん坊', '首がいちばん長いやつ'], habit: ['1日に30分しか寝ない', '水を飲むにはまず開脚しないといけない'] },
      penguin: { name: 'ペンギン', short: 'ペンギン', home: '南極の流氷', atk: ['腹すべりタックル', '氷上大暴走'], epi: ['南極の紳士', '氷上のすべり屋'], habit: ['歩くとよちよちだが、すべると誰よりも速い', '一年じゅう礼服を着ている'] },
      frog: { name: 'カエル', short: 'フロッグ', home: '雨あがりのハスの葉', atk: ['舌うち奇襲', '連続カエルとび'], epi: ['池のスター', 'ハスの葉の主'], habit: ['舌を出すのがまばたきより速い', '雨が降ると一晩じゅうライブをひらく'] },
      cow: { name: 'ウシ', short: 'ウシ', home: 'アルプスの牧場', atk: ['暴れ牛タックル', 'ミルク噴水'], epi: ['歩くミルクタンク', '反すうの達人'], habit: ['胃が4つあり、1回の食事を8時間かんでいる', '1日に25リットルの牛乳を出す'] },
      rooster: { name: 'ニワトリ', short: 'チキン', home: '村はずれのわら山', atk: ['夜明けのコケコッコー', '連続つつき'], epi: ['夜明けのラッパ手', '村いちばんの暴れ者'], habit: ['毎朝4時きっかりに全員を起こす', '鏡にうつった自分にもケンカを売る'] },
      cobra: { name: 'コブラ', short: 'コブラ', home: 'ガンジス川のほとりの草むら', atk: ['毒液スプレー', '死のにらみ'], epi: ['草むらの刺客', 'ヘビ使いの相棒'], habit: ['怒ると首がうちわのように広がる', '舌を出してにおいをかぐ'] },
      turtle: { name: 'カメ', short: 'タートル', home: 'ガラパゴスの砂浜', atk: ['こうら体当たり', '首ひっこめガード'], epi: ['百歳のご長寿', 'のんびり王者'], habit: ['150年生きるので、ぜったいに急がない', '物音がするとすぐ首をひっこめる'] },
      bee: { name: 'ミツバチ', short: 'ビー', home: '菜の花畑の上空', atk: ['おしり針つき', '8の字ダンスナビ'], epi: ['花畑の働き者', '巣の守り手'], habit: ['8の字ダンスで仲間に花の場所を教える', '一生かけて作れるハチミツは小さじ1杯'] },
      panda: { name: 'パンダ', short: 'パンダ', home: '四川の竹林', atk: ['パンダころがり', '竹ざお払い'], epi: ['竹林の隠者', '目のクマが自慢の国宝'], habit: ['1日14時間、竹を食べている', 'ケンカはだいたい転がって勝つ'] },
      snail: { name: 'カタツムリ', short: 'カタツムリ', home: '雨あがりのキャベツの葉', atk: ['ねばねばトラップ', 'カラごもり'], epi: ['マイホーム持ち', 'スローの伝説'], habit: ['どこへ行くにも家をせおっている', '全力で進んでも1分に8センチ'] },
    },
    mech: {
      fan: { name: '扇風機', pre: ['ターボ', '首振り', '強風'], place: '中古家電の市場', atk: ['強風モード', '首振りなぎ払い'], epi: ['止まらない', '夏の夜を救う'], quirk: ['緊張すると首を左右に振りはじめる', '「強」にすると何を叫んでいるのか誰にも聞こえない'], weak: 'コンセントを抜かれること' },
      train: { name: '機関車', pre: ['蒸気', '特急', '鈍行'], place: '使われなくなった操車場', atk: ['蒸気タックル', '全速力で入線'], epi: ['時刻表どおりの', 'ポッポとうるさい'], quirk: ['興奮すると汽笛を鳴らして頭から煙を出す', '線路がないと曲がるのが苦手'], weak: '40分の遅延' },
      plane: { name: '飛行機', pre: ['ジェット', '超音速', 'ジャンボ'], place: '空港の手荷物ターンテーブル', atk: ['急降下爆撃', 'ソニックブーム'], epi: ['高度一万メートルの', '着陸しない'], quirk: ['飛び立つ前に2キロは助走がいる', '着陸するたびに拍手をもらえると思っている'], weak: '航空管制' },
      phone: { name: 'スマホ', pre: ['5G', '画面バキバキ', 'アンテナ全開'], place: 'スマホ修理の屋台', atk: ['未読99+連打', '強制顔認証'], epi: ['常時オンラインの', '既読スルーの'], quirk: ['バッテリーが20%を切るとそわそわする', '3分おきに画面を光らせて新着を確かめる'], weak: '電波が1本しか立たないこと' },
      pc: { name: 'パソコン', pre: ['ブルースクリーン', 'フリーズ', 'メカニカルキー'], place: 'ネットカフェのすみっこ', atk: ['ブルースクリーンにらみ', '強制再起動'], epi: ['アップデート中の', '応答なしの'], quirk: ['大事な場面にかぎって「更新中です。電源を切らないでください」と出る', 'タブを3つ開くとゼーゼー言いはじめる'], weak: '37%で止まったアップデート' },
      tv: { name: 'テレビ', pre: ['砂あらし', 'ブラウン管', 'リモコン'], place: 'おばあちゃんちの居間', atk: ['砂あらし催眠', 'CM連続放送'], epi: ['つづきはCMのあとの', 'チャンネルを変えない'], quirk: ['映りが悪いときは2回たたけば直る', 'いいところで必ずCMに入る'], weak: 'お母さんの「ごはんよ」' },
      rocket: { name: 'ロケット', pre: ['月面行き', 'ブースター', '二段式'], place: '発射場のスクラップ置き場', atk: ['点火リフトオフ', '脱出タワー射出'], epi: ['行ったきり帰らない', '第一宇宙速度の'], quirk: ['出かける前にかならず10からカウントダウンする', 'あせるとおしりから火をふく'], weak: '打ち上げ延期' },
      tank: { name: '戦車', pre: ['装甲', 'キャタピラ', '重砲'], place: '軍事博物館の裏庭', atk: ['主砲いっせい射撃', 'キャタピラふみつぶし'], epi: ['弾をはじき返す', '鋼鉄の'], quirk: ['向きを変えるにはその場で回らないといけない', '通ったあとの道はぜんぶ舗装しなおしになる'], weak: 'ガソリン代の値上がり' },
      guitar: { name: 'エレキギター', pre: ['ロック', 'ディストーション', 'ヘビメタ'], place: '地下のリハーサルスタジオ', atk: ['ひずみの壁', 'チョーキング絶叫'], epi: ['音量を11まで上げた', 'チューニングしない'], quirk: ['一歩あるくたびにエコーとひずみがかかる', 'アンプにつながないとうまくしゃべれない'], weak: 'ご近所からの通報' },
      toilet: { name: 'トイレ', pre: ['水洗', 'サイフォン', 'スマート'], place: 'デパート3階のお手洗い', atk: ['サイフォン渦巻き', '水洗ツナミ'], epi: ['来る者をこばまない', '底なしの'], quirk: ['ものを食べたあとは必ずジャーッと水を流す', '冬に座られると相手をヒヤッとさせる'], weak: '断水' },
      car: { name: '自動車', pre: ['ターボ', 'マニュアル', '四駆'], place: '中古車センター', atk: ['ロケットスタート', 'ハイビーム攻撃'], epi: ['アクセル全開の', 'いつも渋滞中の'], quirk: ['高速に乗るとすぐ追い越したがる', '5000キロごとにオイルを飲みたがる'], weak: '朝のラッシュ' },
      heli: { name: 'ヘリコプター', pre: ['ローター', 'ホバリング', '武装'], place: '病院の屋上ヘリポート', atk: ['ローター斬り', 'ホバリング掃射'], epi: ['その場で飛び立つ', '風をまき起こす'], quirk: ['うれしくなるとその場で回って飛び立つ', '3キロ先まで音が聞こえるほどうるさい'], weak: '強風の日' },
      sub: { name: '潜水艦', pre: ['深海', 'ソナー', '原子力'], place: '海軍基地の乾ドック', atk: ['魚雷いっせい発射', 'ソナー衝撃波'], epi: ['深くひそむ', '音を立てない'], quirk: ['こまるとだまって潜っていく', 'はね返ってくる音で道をさがす'], weak: '息つぎの浮上' },
      moto: { name: 'バイク', pre: ['暴走', 'ひざすり', 'マフラー'], place: '真夜中の環状道路', atk: ['ひざすりドリフト', 'マフラー爆音'], epi: ['真夜中を走る', '地面すれすれの'], quirk: ['カーブではひざを地面にこすりたがる', '真夜中にエンジンをふかして近所めいわく'], weak: '雨の日のすべる路面' },
      washer: { name: '洗濯機', pre: ['ドラム式', '脱水', '高速回転'], place: '学生寮のランドリー', atk: ['ドラムストーム', '高速脱水'], epi: ['回りつづける', '靴下を食べる'], quirk: ['洗うたびに靴下を片方だけこっそり食べる', '脱水のときは部屋じゅうを走り回る'], weak: '洗濯物の入れすぎ' },
      fridge: { name: '冷蔵庫', pre: ['冷凍', 'チルド', '両開き'], place: 'シェアハウスの台所', atk: ['急速冷凍ブレス', '冷蔵室とじこめ'], epi: ['夜中に光る', '残りものだらけの'], quirk: ['真夜中になるとだれかにドアを開けられる', 'おなかに3年前の残りものをかくしている'], weak: 'ドアの閉め忘れ' },
      piano: { name: 'ピアノ', pre: ['88鍵', '調律ズレ', '発表会'], place: '音楽教室の練習室', atk: ['フォルテ爆撃', '88鍵れんだ'], epi: ['発表会の悪夢の', '白黒はっきりした'], quirk: ['緊張すると音がずれる', '足をふまれると音が長くひびく'], weak: '6階までの引っこし' },
      dozer: { name: 'ブルドーザー', pre: ['整地', '解体', 'キャタピラ'], place: '下町の工事現場', atk: ['なんでも更地', 'キャタピラふみつぶし'], epi: ['ビルを見ると押したくなる', '工事現場の'], quirk: ['でこぼこを見ると平らにしたくなる', 'まっすぐにしか進めない'], weak: '立ちのかない一軒' },
      balloon: { name: '熱気球', pre: ['熱気', 'ふわふわ', '空気入り'], place: 'トルコの谷の上空', atk: ['熱風ブレス', '上空から砂袋'], epi: ['風まかせの', '熱い空気でいっぱいの'], quirk: ['どこへ行くかは風しだい', '空気がぬけるとその場に着陸する'], weak: '針のひと刺し' },
      ufo: { name: 'UFO', pre: ['宇宙', '反重力', 'ビーム'], place: 'エリア51の格納庫', atk: ['トラクタービーム', 'ミステリーサークル'], epi: ['正体不明の', 'ウシばかりさらう'], quirk: ['夜中にウシを空へ吸い上げるのが好き', '写真にとるといつもぼやける'], weak: 'はっきり写った写真' },
    },
  },
};

const LANG_ORDER = ['zh', 'en', 'ja'];
function detectLang() {
  let saved = null;
  try { saved = localStorage.getItem('stitch-lang'); } catch (e) { /* 读不了就按浏览器的来 */ }
  if (saved && I18N[saved]) return saved;
  const prefs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
  for (const p of prefs) {
    const l = String(p).toLowerCase();
    if (l.startsWith('zh')) return 'zh';
    if (l.startsWith('ja')) return 'ja';
    if (l.startsWith('en')) return 'en';
  }
  return 'en';
}
const LANG = detectLang(), L = I18N[LANG], TX = L.ui;
function nextLang() { const n = LANG_ORDER[(LANG_ORDER.indexOf(LANG) + 1) % LANG_ORDER.length]; try { localStorage.setItem('stitch-lang', n); } catch (e) { /* 存不了就只能跟着浏览器语言 */ } location.reload(); }

(() => {
  for (const d of BIO) if (L.bio && L.bio[d.id]) Object.assign(d, L.bio[d.id]);
  for (const d of MECH) if (L.mech && L.mech[d.id]) Object.assign(d, L.mech[d.id]);
  document.documentElement.lang = L.code;
  document.title = TX.title;
  document.querySelectorAll('[data-i18n]').forEach(e => { const v = TX[e.dataset.i18n]; if (typeof v === 'string') e.textContent = v; });
  document.querySelectorAll('[data-i18n-html]').forEach(e => { const v = TX[e.dataset.i18nHtml]; if (typeof v === 'string') e.innerHTML = v; });
  document.querySelectorAll('[data-i18n-aria]').forEach(e => { const v = TX[e.dataset.i18nAria]; if (typeof v === 'string') e.setAttribute('aria-label', v); });
})();
