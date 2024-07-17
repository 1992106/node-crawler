const fs = require("fs");
const cheerio = require("cheerio");
const superagent = require("superagent");
const axios = require('axios');
const nodeSchedule = require("node-schedule");

const weiboURL = "https://s.weibo.com";
const hotSearchURL = weiboURL + "/top/summary?cate=realtimehot";

function getHotSearchList() {
  return new Promise((resolve, reject) => {
    superagent.get(hotSearchURL, (err, res) => {
      if (err) {
        console.error("request error");
        reject(err);
      }
      const $ = cheerio.load(res.text);
      let hotList = [];
      $("#pl_top_realtimehot table tbody tr").each(function (index) {
        if (index !== 0) {
          const $td = $(this).children().eq(1);
          const link = weiboURL + $td.find("a").attr("href");
          const text = $td.find("a").text();
          const hotValue = $td.find("span").text();
          const icon = $td.find("img").attr("src")
            ? "https:" + $td.find("img").attr("src")
            : "";
          hotList.push({
            index,
            link,
            text,
            hotValue,
            icon,
          });
        }
      });
      resolve(hotList);
    });
  });
}

function getHotSearchList2() {
  return axios.get(hotSearchURL).then(res => {
    const $ = cheerio.load(res.data);
    let hotList = [];
    $(".list .list_a>li>a").each(function (index) {
      const link = weiboURL + $(this).attr("href");
      const $span = $(this).find("span");
      const text = $span[0].children[0].data;
      const hotValue = $span.find("em").text();
      const icon = $span.find("img").attr("src")
        ? "https:" + $span.find("img").attr("src")
        : "";
      hotList.push({
        index,
        link,
        text,
        hotValue,
        icon,
      });
    });
    return hotList;
  }).catch(err => {
    console.error("request error");
    return err;
  });
}

nodeSchedule.scheduleJob("1 * * * * *", async function () {
  try {
    const hotList1 = await getHotSearchList();
    await fs.writeFileSync(
      `${__dirname}/hotSearch1.json`,
      JSON.stringify(hotList1),
      "utf-8"
    );
    const hotList2 = await getHotSearchList2();
    await fs.writeFileSync(
      `${__dirname}/hotSearch2.json`,
      JSON.stringify(hotList2),
      "utf-8"
    );
  } catch (error) {
    console.error(error);
  }
});