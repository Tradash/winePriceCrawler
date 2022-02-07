const regGetPrice = new RegExp('(?<price>(?:\\d+\\s)?\\d+).*$');



export const findPrice = (s:string):number=>{
const m = regGetPrice.exec(s)
    if (m && m.groups) return Number(m.groups.price.replace(/ /g, ''))
    return 0
}

export const findValue = (s:string):number=>{
    const regGetValue = /^.*(?<value>\d+)\sшт.*$/gm
    const m = regGetValue.exec(s)
    if (m && m.groups) return Number(m.groups.value.replace(/ /g, ''))
    return 0
}

