(function () {
  'use strict';
  const report = window.QuantResearch;
  const element = id => document.getElementById(id);
  if (!report) {
    element('research-status').textContent = '实验结果未能加载，请刷新或下载完整结果 JSON。';
    return;
  }
  const percent = value => value === null ? '不适用' : (value * 100).toFixed(2) + '%';
  const decimal = value => value === null ? '不适用' : value.toFixed(4);
  const splitNames = { train: '训练', validation: '验证', test: '最终测试' };
  function cellRow(values) {
    const row = document.createElement('tr');
    values.forEach(value => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    });
    return row;
  }
  function renderMetrics() {
    const name = element('research-split').value;
    const split = report.splits[name];
    element('research-range').textContent = `${splitNames[name]}：${split.start} 至 ${split.end} · ${split.count} 条 · 其中上涨 ${split.up_count} 条`;
    const cards = [
      ['模型准确率', percent(split.model.accuracy)],
      ['多数类准确率', percent(split.majority.accuracy)],
      ['平衡准确率', percent(split.model.balanced_accuracy)],
      ['ROC AUC', decimal(split.model.roc_auc)]
    ];
    element('research-metrics').replaceChildren();
    cards.forEach(([label, value]) => {
      const card = document.createElement('div');
      card.className = 'card';
      const title = document.createElement('div');
      title.className = 'metric-label';
      title.textContent = label;
      const metric = document.createElement('div');
      metric.className = 'value';
      metric.textContent = value;
      card.append(title, metric);
      element('research-metrics').append(card);
    });
    element('research-bars').replaceChildren();
    [['逻辑回归', split.model.accuracy], ['训练集多数类', split.majority.accuracy], ['延续前日方向', split.persistence_accuracy]].forEach(([label, value]) => {
      const wrapper = document.createElement('div');
      const text = document.createElement('div');
      text.textContent = `${label}：${percent(value)}`;
      const track = document.createElement('div');
      track.className = 'bar-track';
      const fill = document.createElement('div');
      fill.className = 'bar-fill';
      fill.style.width = (value * 100) + '%';
      track.append(fill);
      wrapper.append(text, track);
      element('research-bars').append(wrapper);
    });
    const matrix = split.model.confusion_matrix;
    const allUp = matrix[0][0] + matrix[1][0] === 0;
    const difference = (split.model.accuracy - split.majority.accuracy) * 100;
    element('research-conclusion').textContent = `${allUp ? '模型在这个区间全部预测为上涨。' : ''}准确率较多数类基准差 ${difference.toFixed(2)} 个百分点。模型 log loss ${decimal(split.model.log_loss)}，基准 ${decimal(split.majority.log_loss)}（越低越好）。${name === 'test' ? '本次固定测试未显示模型优势，不支持用于投资判断。' : '该区间参与拟合或参数选择，不能作为独立泛化证据。'}`;
  }
  function renderPredictions() {
    const rows = report.predictions.filter(row => !element('research-errors').checked || row.actual !== row.predicted);
    element('prediction-count').textContent = `显示 ${rows.length} / ${report.predictions.length} 条；概率是模型估计，未做概率校准。`;
    element('research-predictions').replaceChildren(...rows.map(row => cellRow([
      row.date, row.information_date, percent(row.probability_up), row.predicted ? '上涨' : '非上涨',
      row.actual ? '上涨' : '非上涨', row.actual === row.predicted ? '正确' : '错误'
    ])));
  }
  element('research-status').textContent = '已完成真实数据训练与固定测试；未发现优于多数类基准的证据。';
  Object.entries(report.splits).forEach(([name, split]) => element('research-splits').append(cellRow([
    splitNames[name], `${split.start} — ${split.end}`, split.count,
    { train: '拟合标准化与模型', validation: '选择正则参数', test: '只评估，不调参' }[name]
  ])));
  element('research-config').textContent = `实验 ${report.experiment}；C=${report.config.selected_C}；固定阈值 0.5；seed=${report.config.seed}；scikit-learn ${report.environment.sklearn}。先前 20 条记录用于预热，不计入训练样本。`;
  element('research-hash').textContent = `原始数据 SHA-256：${report.source.sha256}`;
  element('research-split').addEventListener('change', renderMetrics);
  element('research-errors').addEventListener('change', renderPredictions);
  document.querySelector('a[href="#tools"]').addEventListener('click', () => { element('tools').open = true; });
  renderMetrics();
  renderPredictions();
})();
