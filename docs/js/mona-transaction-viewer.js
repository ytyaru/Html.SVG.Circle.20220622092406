class MonaTransactionViewer {
    constructor(my) { // my: 自分のアドレス
        this.my = my
        //this.my = my || (window.hasOwnProperty('mpurse')) ? await window.mpurse.getAddress() : null
        this.register = new ProfileRegister()
        this.gen = new ProfileGenerator()
    }
    async generate(json) {
        this.profiles = await this.register.get()
        return this.makeTerm(json)
             + '<br>'
             + this.makePayBalanceAmount(json)
             + '<br>'
             + this.makePeoplesTable(this.makePayPeoples(json), '支払')
             + '<br>'
             + this.makePeoplesTable(this.makeReceivedPeoples(json), '受取')
    }
    makeTerm(json) { // 日時（最後の取引〜最初の取引）
        return this.#makeTime(new Date(json.result[json.result.length-1].time * 1000))
                + '〜'
                + this.#makeTime(new Date(json.result[0].time * 1000))
                + `　<span><span id="transaction-count">${json.result.length}</span>回</span>`
                + `（<span><span id="pay-count">${this.calcTotalPayCount(json)}</span>出</span>`
                + `　<span><span id="received-count">${this.calcTotalReceivedCount(json)}</span>入</span>）`
    }
    #makeTime(date) { // date型
        //console.debug(date)
        const iso = date.toISOString()
        const month = (date.getMonth()+1).toString().padStart(2, '0')
        const dates = date.getDate().toString().padStart(2, '0')
        //const hours = date.getHours().toString().padStart(2, '0')
        //const minutes = date.getMinutes().toString().padStart(2, '0')
        //const seconds = date.getSeconds().toString().padStart(2, '0')
        const format = `${date.getFullYear()}-${month}-${dates}`
        //const format = `${date.getFullYear()}-${month}-${date} ${hours}:${minutes}:${seconds}`
        return `<time datetime="${iso}" title="${iso}">${format}</time>`
    }
    makePayBalanceAmount(json) {
        const pay = this.calcTotalPay(json)
        console.debug(pay)
        const received = this.calcTotalReceived(json)
        console.debug(received)
        const balance = this.calcBalance(received, pay) // received - pay
        console.debug(balance)
        return `<table><tr><th>支払総額</th><td class="num"><span id="total-pay">${pay.toFixed(8)}</span> MONA</td></tr><tr><th>受取総額</th><td class="num"><span id="balance">${received.toFixed(8)}</span> MONA</td></tr><tr><th>残高</th><td class="num"><span id="balance">${balance.toFixed(8)}</span> MONA</td></tr></table>`
    }
    makePeoplesTable(results, caption) {
        console.debug(results)
        const trs = []
        for (const r of results) {
            const profile = this.getProfile(r.address)
            console.debug(profile)
            if (profile) {
                if (profile.hasOwnProperty('error')) { profile = null }
                else { profile.profile['address'] = profile.address }
            }
            //if (profile && profile.hasOwnProperty('error')) { profile = null }
            //else if (profile) {profile.profile['address'] = profile.address}
            //const tdAddrContent = (profile) ? this.gen.generate(profile) : r.address
            //const tdAddr = `<td class="user-total-pay-address">${r.address}</td>`
            //const tdAddr = `<td class="user-total-pay-address">${this.gen.generate(profile)}</td>`
            const tdAddr = `<td class="user-total-pay-address">${(profile) ? this.gen.generate(profile.profile) : r.address}</td>`
            const tdValues = `<td><span class="user-total-pay-amount">${r.sum.toFixed(8)}</span></td>`
            const tdHistory = `<td>${this.makePayWhenValueTable(r.history)}</td>`
            trs.push(`<tr>${tdAddr}${tdValues}${tdHistory}</tr>`)
        }
        return `<table><caption>${caption}</caption>` + trs.join('') + '</table>'
    }
    makePayWhenValueTable(history) {
        return '<table>' + history.map(d=>`<tr><td class="num">${d.value.toFixed(8)} MONA</td><td>${this.#makeTime(d.time)}</td></tr>`).join('') + '</table>'
    }
    makePayPeoples(json) { return this.makePeoples(json.result.filter(r=>this.isPay(r.vout))) }
    makeReceivedPeoples(json) { return this.makePeoples(json.result.filter(r=>!this.isPay(r.vout))) }
    makePeoples(results, isPay) {
        const datas = []
        for (const r of results) {
            const addr = r.vout[(this.my == r.vout[0].scriptPubKey.addresses[0]) ? 1 : 0].scriptPubKey.addresses[0]
            const i = datas.findIndex(a=>a.address==addr)
            const history = (-1 < i) ? datas[i].history : []
            const sum = (-1 < i) ? datas[i].sum : 0
            if (-1 < i) {
                datas[i].sum += r.vout[0].value
                datas[i].history.push({time:new Date(r.time * 1000), value:r.vout[0].value})
            }
            else {datas.push({address:addr, sum:r.vout[0].value, history:[{time:new Date(r.time * 1000), value:r.vout[0].value}]})}
        }
        return datas.sort((a,b)=>b.sum - a.sum)
    }

    calcTotalPayCount(json) { // 支払総回数を算出する
        return json.result.filter(r=>this.isPay(r.vout)).length
    }
    calcTotalReceivedCount(json) { // 受取総回数を算出する
        return json.result.filter(r=>!this.isPay(r.vout)).length
    }
    calcTotalPay(json) { // 支払総額を算出する
        return json.result.filter(r=>this.isPay(r.vout)).map(r=>r.vout[0].value).reduce((sum,v)=>sum+v)
    }
    calcTotalReceived(json) { // 受取総額を算出する
        return json.result.filter(r=>!this.isPay(r.vout)).map(r=>r.vout[0].value).reduce((sum,v)=>sum+v)
    }
    calcBalance(received, pay) { // 残高を算出する
        return received - pay
    }
    isPay(vout) { // この取引情報は支払いであるか（真:支払、偽:受取）
        return (vout[1].scriptPubKey.addresses[0] == this.my)
    }
    getProfile(address) {
        const i = this.profiles.findIndex(p=>p.address===address)
        if (-1 == i) { return null }
        console.debug(this.profiles[i])
        if(typeof this.profiles[i].profile === 'string' || this.profiles[i].profile instanceof String) {
            this.profiles[i].profile = JSON.parse(this.profiles[i].profile)
        }
        return this.profiles[i]
    }
}
