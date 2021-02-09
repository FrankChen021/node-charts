# Description

This project ships a HTTP service which converts an Apache ECharts to a PNG image.

# Build

```
docker build -t image-render .
```

# Run

```
docker run -d -p 9999:80 image-render
```

# Usage

## Convert Apache EChart to base64-formatted image

POST the following request to http://<YOUR_HOST>:9999/convert to get base64-formatted image
```
{
    "height": 600,
    "width": 800,
    "eChartOption": {
        "xAxis": {
            "type": "category",
            "data": [
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
                "Sun"
            ]
        },
        "yAxis": {
            "type": "value"
        },
        "series": [
            {
                "data": [
                    150,
                    230,
                    224,
                    218,
                    135,
                    147,
                    260
                ],
                "type": "line"
            }
        ]
    }
}
```
Note: the ECharts option above is taken from [Apache ECharts Offical Site](https://echarts.apache.org/examples/zh/editor.html?c=line-simple)
