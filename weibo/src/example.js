// https://segmentfault.com/a/1190000013910680
const cheerio = require('cheerio');
const agent = require('superagent');
const path = require('path');
const fs = require('fs');

// 地址数据
const urls = [{
    page:1,
    url:"https://www.imooc.com/course/list?c=fe&page=1"
},{
    page:2,
    url:"https://www.imooc.com/course/list?c=fe&page=2"
},{
    page:3,
    url:"https://www.imooc.com/course/list?c=fe&page=3"
}];

// 最终的数据
let result = [];


// 数据结构
/**
 * [
 *     {
 *         page: 1,
 *         data: [
 *                {title:xx,imgurl:xx...},
 *                ......
 *               ]
 *     }
 *     ......
 * ]
 */


// 发起get请求
function requestGet(urlObj,callback) {

    agent.get(urlObj.url)
     .end((err,res) => {
         if(err) throw new Error(err);

         // 分析页面
         let pageJson = analysis(res.text);

         // 拼接数据
         result.push({
             page:urlObj.page,
             data:pageJson
         });

         console.log(`写入第${urlObj.page}页的数据...`);

         // 执行回调
         callback();

     });
}


// 对网页分析
function analysis(data){

    let page = [];
    let $ = cheerio.load(data);
    let courseArr = $(".course-list").find(".course-card-container");
    courseArr.each((index,element) => {
        let _this = $(element);
        // 组装数据
        page.push({
            title:_this.find(".course-card-name").text(),
            imgurl:path.join("http:",_this.find(".course-card-top img").attr("src")),
            level:_this.find(".course-card-info span:first-child").text(),
            // level:_this.find(".icon-set_sns").parent().prev().text(),
            studynum:_this.find(".icon-set_sns").parent().text(),
            description:_this.find(".course-card-desc").text()
        });
    });
    return page;
}


// 实现队列
// 本质： 对.then()方法实现累加
let curPromise = urls.reduce((promise,curl) => {

    return promise.then(() => {
        return new Promise(resolve => {
            // 具体的内容
            requestGet(curl,() => {
                resolve();
            });
        });
    });

},Promise.resolve());

// 写入数据
curPromise.then(()=>{
    fs.writeFile('result.json', JSON.stringify(result), function (err) {
        if(err) throw new Error("appendFile failed...");
        console.log("数据写入success...");
    });
});
