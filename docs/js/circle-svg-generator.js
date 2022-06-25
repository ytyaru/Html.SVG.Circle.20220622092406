class CircleSvgGenerator {
    constructor() {
        this.userIconSizes = [96,72,64,48,32,24,20] // 差24,8,16,16,8,4
        this.userIconNum = [1,8,16,32,48,64,88]
        this.size = this.userIconSizes[0] + this.userIconSizes.slice(1).reduce((sum,v)=>sum+v)*2
    }
    generate() { // 中央ユーザの表示サイズ、周辺ユーザの表示数＆表示サイズ
        return this.#makeSvg(this.#makeCss()+this.#makeBackground()+this.#makeUsers())
    }
    #makeSvg(content) { return `<svg width="${this.size}" height="${this.size}">${content}</svg>` }
    #makeCss() { return `<defs><style type="text/css"><![CDATA[${this.#makeClipCss()}]]></style></defs>` }
    #makeClipCss() { return this.userIconSizes.map(size=>`.clip-${size}{ clip-path: circle(${size/2}px at center); }`).join('\n') }
    #makeBackground() { return `<rect x="0" y="0" width="${this.size}" height="${this.size}" style="fill:green" />` }
    #makeUsers() {
        //this.userIconNum = Array.from({length: 6}, (v, k) => k).map(i=>this.#calcIconNum(i))
        //console.debug(this.userIconNum)
        //const nums = Array.from({length: 6}, (v, k) => k).map(i=>this.#calcIconNum(i))
        //console.debug(nums)
        const imgs = Array.from({length: 6}, (v, k) => k).map(i=>this.#makeOuter(i))
        imgs.push(this.#makeCenter())
        return imgs.join('')
    }
    #makeUser(site, src, size, x, y) { return `<a href="${site}"><image href="${src}" width="${size}" height="${size}" x="${x}" y="${y}" class="clip-${size}" /></a>` }
    #makeCenter() {
        const center = (this.size / 2)
        const size = this.userIconSizes[0]
        const leftTop = center - (size / 2)
        return this.#makeUser('https://ytyaru.github.io/', './asset/image/avator.png', size, leftTop, leftTop)
    }
    #makeOuter(i) { // i=0,1,2,3...
        const imgs = []
        const itemNum = this.userIconNum[i+1]
        //const itemNum = this.userIconNum[i]
        const deg = 360 / itemNum
        const start = (deg * Math.PI / 180.0)
        const size = this.userIconSizes[i+1]
        const middles = this.userIconSizes.slice(1,i+1)
        const r = ((this.userIconSizes[0]+this.userIconSizes[i+1])/2) + ((0==middles.length) ? 0 : middles.reduce((sum,v)=>sum+v))
        const center = (this.size / 2)
        const leftTop = center - ((this.userIconSizes[0]/2) + this.userIconSizes.slice(1,i+2).reduce((sum,v)=>sum+v))
        for (let i=0; i<itemNum; i++) {
            const x = Math.cos(start * i - Math.PI / 2) * r + r + leftTop;
            const y = Math.sin(start * i - Math.PI / 2) * r + r + leftTop;
            imgs.push(this.#makeUser('', './asset/image/user/kkrn_icon_user_3_resize_min.svg', size, x, y))
        }
        return imgs.join('')
    }
    #calcIconNum(i) { // i:0,1,2,...  return:外周位置におけるアイコン同士が重ならない最大配置数を返す
        console.debug(i)
        //const outerCircleSize = this.userIconSizes.slice(0,i+2).reduce((sum,v)=>sum+v) // 外１全体の直径から外１画像の中点までの距離（実際に表示すると隙間が多すぎた。外１だけはぴったり気味）
        const outerCircleSize = ((this.userIconSizes[0]+this.userIconSizes[i+1])/2) + ((0==middles.length) ? 0 : middles.reduce((sum,v)=>sum+v))
        console.debug(this.userIconSizes.slice(0,i+2))
        console.debug(outerCircleSize)
        const circumference = outerCircleSize * Math.PI // 外１全体の円周＝直径×円周率
        console.debug(circumference)
        return parseInt(circumference / this.userIconSizes[i+1])
        //return circumference / this.userIconSizes[i+1]
    }
}
