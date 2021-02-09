
const express = require('express');
const bodyParser = require('body-parser');
const { createCanvas,  registerFont } = require("canvas");
const OSS = require('ali-oss');
const { v1: uuidv1 } = require('uuid');
const moment = require('moment');

/*
 * register a font so that image rendering supports Chinese characters
 */
registerFont('STHeiti-Light.ttc', {family:'Heiti'});

/*
 * initialize express application
 */
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

var isDebugOn = false;
app.post('/debug/on', (request, response) =>{
    isDebugOn = true;
    response.send("debug switch turned on");
});
app.post('/debug/off', (request, response) =>{
    isDebugOn = false;
    response.send("debug switch turned off");
});

/*
 * Description: Convert an EChart to a PNG in base64 format
 * Input:  
 *      {
 *          height: <height of the image in pixel>
 *          width:  <width of the image in pixel>
 *          eChartOption: <echart option of the image>
 *      }
 * 
 * Returns:
 *      {
 *          image: {
 *              content: <Returns: the content of PNG in base64 format>
 *          }
 *          cost: {
 *              render: <cost time of image rendering in milliseconds>,
 *              save: <cost time of image saving in milliseconds>,
 *          },
 *          debug: <debug switch>
 *      }
 */
app.post('/convert', (request, response) => {
    try {
        var obj = request.body;
        if ( obj.eChartOption == null && obj.echartOption == null ) {
            response.status(400).send('eChartOption is null');
            return;
        }
       
        let config = {
            option: obj.eChartOption == null ? obj.echartOption : obj.eChartOption,
            width: obj.width == null ? 600 : obj.width,
            height: obj.height == null ? 450 : obj.height,
            enableAutoDispose: true,
            name: uuidv1()
        };

        const echarts = require("echarts");
        echarts.setCanvasCreator(function () {
            return canvas;
        });

        if ( isDebugOn ) {
            console.log(JSON.stringify(config.option, null, 4));
        }

        config.option.animation = false;
        if ( config.option.textStyle == null ) {
            config.option.textStyle = new Object();
        }
        config.option.textStyle.fontFamily = "Heiti";

        /*
         * By constract to the client rendering, no split lines are rendering in server side
         * To circumvent this problem, apply a default style to the yAxis
         */
        if ( config.option.yAxis != null && config.option.yAxis.splitLine == null ) {
            config.option.yAxis.splitLine = {
                "show": true,
                "lineStyle": {
                    "color": [
                        "#aaa"
                    ]
                }
            }
        }
        
        var t1 = new Date().getTime();
        {
            var canvas = createCanvas(parseInt(config.width, 10), parseInt(config.height, 10));
            var chart = echarts.init(canvas);
            chart.setOption(config.option);
            var buffer = canvas.toBuffer();
            try {
                if (config.enableAutoDispose) {
                    chart.dispose();
                }
            } catch (e) {
            }
        }
        var t2 = new Date().getTime();
        response.send({
            image: {
                content: buffer.toString('base64')
            },
            cost: {
                render: t2 - t1
            },
            debug: isDebugOn
        });
    } catch (e) {
        response.status(500).send(e.message + '\n' + e.stack);
    }
})

/*
 * Description: Convert an ECharts to a PNG and save it into Alibab Cloud Storage
 * Input:  
 *      {
 *          height: <height of the image in pixel>
 *          width:  <width of the image in pixel>
 *          eChartOption: <echart option of the image>
 *          name: (optional)<name of the image>
 *      }
 * Returns: 
 *      {
 *          image: {
 *              url: <the URL of the image stored in Alibaba Cloud Storage>
 *          }
 *          cost: {
 *              render: <cost time of image rendering in milliseconds>,
 *              save: <cost time of image saving in milliseconds>,
 *          },
 *          debug: <debug switch>
 *      }
 */
app.post('/convertAndSave', async (request, response) => {
    try {
        var obj = request.body;
        if ( obj.eChartOption == null && obj.echartOption == null ) {
            response.status(400).send('eChartOption is null');
            return;
        }
       
        let config = {
            option: obj.eChartOption == null ? obj.echartOption : obj.eChartOption,
            width: obj.width == null ? 600 : obj.width,
            height: obj.height == null ? 450 : obj.height,
            enableAutoDispose: true,
            name: uuidv1()
        };

        const echarts = require("echarts");
        echarts.setCanvasCreator(function () {
            return canvas;
        });

        if ( isDebugOn ) {
            console.log(JSON.stringify(config.option, null, 4));
        }

        config.option.animation = false;
        if ( config.option.textStyle == null ) {
            config.option.textStyle = new Object();
        }
        config.option.textStyle.fontFamily = "Heiti";

        /*
         * By constract to the client rendering, no split lines are rendering in server side
         * To circumvent this problem, apply a default style to the yAxis
         */
        if ( config.option.yAxis != null && config.option.yAxis.splitLine == null ) {
            config.option.yAxis.splitLine = {
                "show": true,
                "lineStyle": {
                    "color": [
                        "#aaa"
                    ]
                }
            }
        }

        var t1 = new Date().getTime();
        {
            var canvas = createCanvas(parseInt(config.width, 10), parseInt(config.height, 10));
            var chart = echarts.init(canvas, {devicePixelRatio: 2.5});
            chart.setOption(config.option);

            var buffer = canvas.toBuffer();
            try {
                if (config.enableAutoDispose) {
                    chart.dispose();
                }
            } catch (e) {
            }
        }

        var saveResult;
        var t2 = new Date().getTime();
        {
            saveResult = await putBufferToOss(config.name, buffer);
        }
        var t3 = new Date().getTime();
        if (saveResult.url != null) {
            response.send({
                url: saveResult.url,
                cost: {
                    render: t2 - t1,
                    save: t3 - t2
                },
                debug: isDebugOn
            });
        } else {
            response.status(500).send(saveResult.error);
        }
    } catch (e) {
        response.status(500).send(e.message + '\n' + e.stack);
    }
})

const argv = require('minimist')(process.argv.slice(2));
console.log(argv);
var ossConfig = {
    region: argv['oss-region'],
    accessKeyId: argv['oss-accessKeyId'],
    accessKeySecret: argv['oss-accessKeySecret'],
    bucket: argv['oss-bucket'],
    prefix: argv['oss-name-prefix']
};

/*
 * start express to serve HTTP requests
 */
var port = parseInt(argv['port']);
app.listen(port, () => {
    console.log(`Listening: http://localhost:${port}`)
});

async function putBufferToOss(name, buffer) {
    try {
        let client = new OSS(ossConfig);
        name = ossConfig.prefix + '/' + moment().format('yyyy-MM-DD') + '/' + name + ".png";
        await client.put(name, buffer);
        const url = client.signatureUrl(name, {
            expires: 3600 * 24 * 3
        });
        return { url: url };
    } catch (e) {
        return { error: e.message }
    }
}
