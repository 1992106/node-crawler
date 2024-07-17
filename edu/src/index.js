const fs = require("fs");
const cheerio = require("cheerio");
const superagent = require("superagent");
const { ToadScheduler, SimpleIntervalJob, AsyncTask } = require('toad-scheduler')

const eduURL = "https://edu.gd.gov.cn/xuexiaochaxun/wbfw_visitor.do";
const searchURL = eduURL + "?action=addSearch";
const listURL = eduURL + "?action=addList";

// 搜索条件
function getSearch() {
  return new Promise((resolve, reject) => {
    superagent.get(searchURL, (err, res) => {
      if (err) {
        console.error("request error");
        reject(err);
      }
      const $ = cheerio.load(res.text);
      const typeList = []
      $('#xxxlb_m option').each(function (index, el) {
        const value = $(el).attr("value")
        const label = $(el).text()
        typeList.push({ label, value })
      })
      const areaList = []
      $('#dq_m option').each(function (index, el) {
        const value = $(el).attr("value")
        const label = $(el).text()
        areaList.push({ label, value })
      })
      resolve({
        typeList: typeList.filter((val) => val.label !== '幼儿园'), // 排除幼儿园
        areaList: areaList.filter((val) => val.value) // 排除全部
      })
      console.log(typeList, areaList)
    })
  })
}

function getList(type, area, page = 1) {
  const xxxlb_m = type?.value || type
  const dq_m = area?.value || area
  return new Promise((resolve, reject) => {
    superagent.get(`${listURL}&xxxlb_m=${xxxlb_m}&dq_m=${dq_m}&page=${page}`, (err, res) => {
      if (err) {
        console.error("request error");
        reject(err);
      }
      const $ = cheerio.load(res.text);
      const list = [];
      $("table tbody tr").each(function (index) {
        if (index !== 0) {
          const $td = $(this).children();
          // 学校名称
          const name = $td.eq(0).text()
          // 机构地址
          const address = $td.eq(1).text()
          // 联系电话
          const phone = $td.eq(2).text()
          // 学校代码
          const code = $td.eq(3).text()
          // 学校性质
          const nature = $td.eq(4).text()
          list.push({ name, address, phone, code, nature });
        }
      });
      const total = $("div[align=center] > select").children().length
      resolve({ list, total });
    });
  });
}

async function getListByTotal(total, type, area) {
  const data = []
  // 从第二页开始
  for (let i = 2; i <= total; i++){
    const { list } = await getList(type, area, i)
    data.push(list)
  }
  console.log(area.label, total)
  return data
}

async function getListByType(typeList, area) {
  const result = []
  for (const type of typeList) {
    const { list, total } = await getList(type, area)
    result.push(list)
    const data = await getListByTotal(total, type, area)
    result.push(...data)
  }
  return result
}

async function start() {
  try {
    const { typeList, areaList } = await getSearch()
    for (const area of areaList) {
      const data = await getListByType(typeList, area)
      const result = data.flat()
      await fs.writeFileSync(
        `${__dirname}/${area.label}.json`,
        JSON.stringify(result),
        "utf-8"
      );
    }
  } catch (err) {
    console.error(err)
  }
}

start()

// const scheduler = new ToadScheduler()
// const task = new AsyncTask(
//   'simple task',
//   () => {},
//   (err) => {
//     console.error(err)
//   }
// )
// const job = new SimpleIntervalJob({ seconds: 60, runImmediately: true }, task)
//
// scheduler.addSimpleIntervalJob(job)
