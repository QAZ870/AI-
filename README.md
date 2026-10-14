# QuantLab · 真实数据预测实验

[在线演示](https://qaz870.github.io/AI-/) · [实验规则](research-spec.md) · [完整结果](research-report.json) · [复现包](research-reproduce.zip)

## 研究问题

仅使用指数过去的收益，逻辑回归能否优于多数类基准，预测下一条交易记录的方向？本项目已完成一次真实历史数据的离线训练与测试。网页呈现固定实验报告，可以切换区间、筛选错误记录、下载原始数据和代码。

## 本次结果

数据：UCI ISTANBUL STOCK EXCHANGE，536 条，2009-01-05 至 2011-02-22。训练 230 条，验证 126 条，最终测试 160 条，另有 20 条预热记录。StandardScaler 仅拟合训练集，验证集选择 C=0.01，阈值固定 0.5，不根据测试结果调参。

| 最终测试指标 | 逻辑回归 | 训练集多数类 |
| --- | ---: | ---: |
| 准确率 | 60.00% | 60.00% |
| 平衡准确率 | 50.00% | 50.00% |
| ROC AUC | 0.4969 | 0.5000 |
| Log loss（越低越好） | 0.673442 | 0.673364 |

模型在 0.5 阈值下全部预测为上涨。60% 准确率来自测试集上涨占比，未显示模型优势。该失败结果保留为错误分析材料，不代表投资能力。

## 来源与署名

Akbilgic, O. (2013). ISTANBUL STOCK EXCHANGE [Dataset]. UCI Machine Learning Repository. https://doi.org/10.24432/C54P4J 。

数据集页面：https://archive.ics.uci.edu/dataset/247/istanbul+stock+exchange 。许可为 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，核验日期 2026-10-14。处理包括提取第一列 ISE（TL BASED）、构造滞后特征与标签、训练并生成报告。保留原始压缩包和 SHA-256。UCI 简介起始日与 Excel 有出入，使用原 Excel 的 2009-01-05，不悄悄改日期。

## 复现

下载并解压 research-reproduce.zip，在解压后的 research 目录运行：

```sh
python -m pip install -r requirements.txt
python train.py
python -m unittest discover -s . -p test_training.py -v
python package.py
```

报告记录 Python、依赖版本、标准化参数、模型系数、规则及代码哈希、验证参数候选和逐条预测。7 项测试覆盖手算特征、未来数据隔离、训练/验证隔离、日期顺序、无效输入、指标计算、重复性。原工作台的行情和财务工具继续保留于折叠区域。

## 边界

这是旧数据、单一市场、小样本的离线分类实验，不是 A 股 ETF 策略、同花顺数据或实盘系统。没有可核实的成交开盘价和总回报口径，因此不计算真实策略收益。国内 510300 样本仍待准入，不包含在公开文件中。

辅助工具使用模拟行情与虚构财务案例，导入 CSV 只在浏览器本地处理、不上传；导入行情不自动进入训练或回测。买入持有演示的初始资金 100,000 元、100 份整数倍、买入成本 0.10%、无分红且期末不卖出；最大回撤从首日日终净值计算，不包含首日成本相对于初始资金的跌幅。研究演示，非投资建议。
