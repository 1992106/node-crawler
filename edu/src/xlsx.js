const { utils, writeFile, writeFileXLSX } = require("xlsx")
const { get } = require("lodash")

const DEF_BOOK_TYPE = 'xlsx'
const DEF_SHEET_NAME = 'sheet'
const DEF_FILE_NAME = `学校-${Date.now()}.${DEF_BOOK_TYPE}`

function isEmpty(value) {
    if (value == null) {
        return true
    }
    if (Array.isArray(value) || typeof value === 'string') {
        return value.length === 0
    }
    if (value instanceof Map || value instanceof Set) {
        return value.size === 0
    }
    if (value !== null && typeof value === 'object') {
        return Object.keys(value).length === 0
    }
    return false
}

// 获取字节长度
function getByteLength(str) {
    let len = str?.length ?? 0
    if (typeof str === 'number') {
        len = (str + '').length
    }
    if (typeof str === 'string') {
        let l = 0
        for (let i = 0; i < len; i++) {
            if ((str?.charCodeAt(i) & 0xff00) != 0) {
                l++
            }
            l++
        }
        len = l
    }
    return len
}

// 设置列宽
function setColumnWidth(data, worksheet, min = 4) {
    const obj = {}
    worksheet['!cols'] = []
    data.forEach(item => {
        Object.keys(item).forEach(key => {
            const len = getByteLength(item?.[key])
            obj[key] = Math.max(len, obj[key] ?? min)
        })
    })
    Object.keys(obj).forEach(key => {
        worksheet['!cols'].push({
            wch: obj[key]
        })
    })
}

function formatJsonData(data, header) {
    const keys = Object.keys(header)
    return data.map(item => {
        return keys.reduce((o, key) => {
            o[key] = get(item, key)
            return o
        }, {})
    })
}

function jsonToSheetXlsx({
    data = [],
    header = {},
    fileName = DEF_FILE_NAME,
    sheetName = DEF_SHEET_NAME,
    json2sheetOpts = {},
    write2excelOpts = { bookType: DEF_BOOK_TYPE }
}) {
    let arrData = [...data]
    if (!isEmpty(header)) {
        arrData = formatJsonData(arrData, header)
        arrData.unshift(header)
        json2sheetOpts.skipHeader = true
    }

    const worksheet = utils.json_to_sheet(arrData, json2sheetOpts)
    setColumnWidth(arrData, worksheet)

    const workbook = utils.book_new()
    utils.book_append_sheet(workbook, worksheet, sheetName)

    // writeFile(workbook, fileName, write2excelOpts)
    writeFileXLSX(workbook, fileName)
}

function jsonToMultipleSheetXlsx({
    sheetList,
    fileName = DEF_FILE_NAME,
    write2excelOpts = { bookType: DEF_BOOK_TYPE }
}) {
    const workbook = {
        SheetNames: [],
        Sheets: {}
    }
    sheetList.forEach((p, index) => {
        let arrData = [...(p.data || [])]
        if (!isEmpty(p.header)) {
            arrData = formatJsonData(arrData, p.header)
            arrData.unshift(p.header)
            p.json2sheetOpts = p.json2sheetOpts || {}
            p.json2sheetOpts.skipHeader = true
        }

        const worksheet = utils.json_to_sheet(arrData, p.json2sheetOpts)
        setColumnWidth(arrData, worksheet)

        p.sheetName = p.sheetName || `${DEF_SHEET_NAME}${index}`
        workbook.SheetNames.push(p.sheetName)
        workbook.Sheets[p.sheetName] = worksheet
    })
    // writeFile(workbook, fileName, write2excelOpts)
    writeFileXLSX(workbook, fileName)
}

module.exports = {
    jsonToSheetXlsx,
    jsonToMultipleSheetXlsx,
}