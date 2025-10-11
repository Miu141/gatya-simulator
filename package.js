import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';

const GachaSimulator = () => {
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [simulationCount, setSimulationCount] = useState(1000);
  
  // ガチャ設定
  const gachaSettings = {
    legendary: { name: '殿堂', rate: 0.002, color: '#FFD700' }, // 0.2%
    gold: { name: '金枠', rate: 0.012, color: '#FFA500' }, // 1.2%
    orange: { name: 'オレンジ枠', rate: 0.3, color: '#FF4500' }, // 30%
    purple: { name: '紫枠', rate: 0.686, color: '#9932CC' }, // 68.6%
    pity: 600 // 天井
  };

  // 単発ガチャシミュレーション
  const drawSingle = () => {
    const random = Math.random();
    if (random < gachaSettings.legendary.rate) return 'legendary';
    if (random < gachaSettings.legendary.rate + gachaSettings.gold.rate) return 'gold';
    if (random < gachaSettings.legendary.rate + gachaSettings.gold.rate + gachaSettings.orange.rate) return 'orange';
    return 'purple';
  };

  // 天井システム付きガチャ
  const drawWithPity = () => {
    let draws = 0;
    let pityCounter = 0;
    let legendary = 0;
    let gold = 0;
    let orange = 0;
    let purple = 0;
    let legendaryDraws = [];

    while (legendary === 0 && draws < 1000) { // 最大1000回で制限
      draws++;
      pityCounter++;
      
      if (pityCounter >= gachaSettings.pity) {
        // 天井到達
        legendary++;
        legendaryDraws.push(draws);
        pityCounter = 0;
      } else {
        const result = drawSingle();
        switch (result) {
          case 'legendary':
            legendary++;
            legendaryDraws.push(draws);
            pityCounter = 0;
            break;
          case 'gold':
            gold++;
            break;
          case 'orange':
            orange++;
            break;
          case 'purple':
            purple++;
            break;
        }
      }
    }

    return { draws, legendary, gold, orange, purple, legendaryDraws };
  };

  // 大規模シミュレーション実行
  const runSimulation = async () => {
    setIsRunning(true);
    
    // 段階的に結果を更新するための遅延
    await new Promise(resolve => setTimeout(resolve, 100));
    
    let totalDraws = 0;
    let totalLegendary = 0;
    let totalGold = 0;
    let totalOrange = 0;
    let totalPurple = 0;
    let legendaryDistribution = [];
    let drawsToFirstLegendary = [];

    // シミュレーション実行
    for (let i = 0; i < simulationCount; i++) {
      const result = drawWithPity();
      totalDraws += result.draws;
      totalLegendary += result.legendary;
      totalGold += result.gold;
      totalOrange += result.orange;
      totalPurple += result.purple;
      
      if (result.legendaryDraws.length > 0) {
        drawsToFirstLegendary.push(result.legendaryDraws[0]);
        legendaryDistribution.push(...result.legendaryDraws);
      }
    }

    // 理論値計算
    const theoreticalExpected = 1 / gachaSettings.legendary.rate; // 500回
    const actualExpected = drawsToFirstLegendary.reduce((a, b) => a + b, 0) / drawsToFirstLegendary.length;

    // 分布データ作成
    const distributionData = [];
    for (let i = 0; i < 600; i += 50) {
      const count = legendaryDistribution.filter(draw => draw >= i && draw < i + 50).length;
      distributionData.push({
        range: `${i}-${i + 49}`,
        count,
        percentage: ((count / legendaryDistribution.length) * 100).toFixed(1)
      });
    }

    // 累積確率データ
    const cumulativeData = [];
    for (let i = 50; i <= 600; i += 50) {
      const theoreticalProb = 1 - Math.pow(1 - gachaSettings.legendary.rate, i);
      const actualCount = drawsToFirstLegendary.filter(draw => draw <= i).length;
      const actualProb = actualCount / drawsToFirstLegendary.length;
      
      cumulativeData.push({
        draws: i,
        theoretical: (theoreticalProb * 100).toFixed(1),
        actual: (actualProb * 100).toFixed(1)
      });
    }

    setResults({
      simulations: simulationCount,
      totalDraws,
      averageDraws: (totalDraws / simulationCount).toFixed(1),
      rarity: [
        { name: '殿堂', theoretical: 0.2, actual: ((totalLegendary / totalDraws) * 100).toFixed(3), count: totalLegendary },
        { name: '金枠', theoretical: 1.2, actual: ((totalGold / totalDraws) * 100).toFixed(3), count: totalGold },
        { name: 'オレンジ枠', theoretical: 30.0, actual: ((totalOrange / totalDraws) * 100).toFixed(3), count: totalOrange },
        { name: '紫枠', theoretical: 68.6, actual: ((totalPurple / totalDraws) * 100).toFixed(3), count: totalPurple }
      ],
      expectedValues: {
        theoretical: theoreticalExpected.toFixed(1),
        actual: actualExpected.toFixed(1),
        difference: Math.abs(theoreticalExpected - actualExpected).toFixed(1)
      },
      distributionData,
      cumulativeData,
      drawsToFirstLegendary
    });
    
    setIsRunning(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">ガチャ確率実験シミュレーター</h1>
      
      {/* 設定表示 */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">実験設定</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-yellow-100 rounded">
            <div className="font-bold text-yellow-800">殿堂</div>
            <div className="text-lg">0.2%</div>
          </div>
          <div className="text-center p-3 bg-orange-100 rounded">
            <div className="font-bold text-orange-800">金枠</div>
            <div className="text-lg">1.2%</div>
          </div>
          <div className="text-center p-3 bg-red-100 rounded">
            <div className="font-bold text-red-800">オレンジ枠</div>
            <div className="text-lg">30.0%</div>
          </div>
          <div className="text-center p-3 bg-purple-100 rounded">
            <div className="font-bold text-purple-800">紫枠</div>
            <div className="text-lg">68.6%</div>
          </div>
        </div>
        <div className="text-center mt-4 p-2 bg-blue-100 rounded">
          <span className="font-bold text-blue-800">天井システム: 600回</span>
        </div>
      </div>

      {/* シミュレーション実行 */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <div className="flex items-center justify-center gap-4">
          <label className="font-semibold">シミュレーション回数:</label>
          <select 
            value={simulationCount} 
            onChange={(e) => setSimulationCount(Number(e.target.value))}
            className="px-3 py-2 border rounded"
            disabled={isRunning}
          >
            <option value={100}>100回</option>
            <option value={500}>500回</option>
            <option value={1000}>1,000回</option>
            <option value={2000}>2,000回</option>
            <option value={5000}>5,000回</option>
          </select>
          <button
            onClick={runSimulation}
            disabled={isRunning}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isRunning ? '実行中...' : '実験開始'}
          </button>
        </div>
      </div>

      {/* 結果表示 */}
      {results && (
        <div className="space-y-6">
          {/* 基本統計 */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">実験結果サマリー</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded shadow">
                <div className="text-sm text-gray-600">総ガチャ回数</div>
                <div className="text-2xl font-bold">{results.totalDraws.toLocaleString()}回</div>
              </div>
              <div className="text-center p-3 bg-white rounded shadow">
                <div className="text-sm text-gray-600">平均回数/1回の試行</div>
                <div className="text-2xl font-bold">{results.averageDraws}回</div>
              </div>
              <div className="text-center p-3 bg-white rounded shadow">
                <div className="text-sm text-gray-600">試行回数</div>
                <div className="text-2xl font-bold">{results.simulations.toLocaleString()}回</div>
              </div>
            </div>
          </div>

          {/* 確率比較表 */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-3">理論値と実測値の比較</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-3 text-left">レア度</th>
                    <th className="border p-3 text-center">理論値(%)</th>
                    <th className="border p-3 text-center">実測値(%)</th>
                    <th className="border p-3 text-center">差異</th>
                    <th className="border p-3 text-center">出現回数</th>
                  </tr>
                </thead>
                <tbody>
                  {results.rarity.map((item, index) => (
                    <tr key={index}>
                      <td className="border p-3 font-medium">{item.name}</td>
                      <td className="border p-3 text-center">{item.theoretical}</td>
                      <td className="border p-3 text-center">{item.actual}</td>
                      <td className={`border p-3 text-center ${Math.abs(item.theoretical - parseFloat(item.actual)) > 0.1 ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                        {(parseFloat(item.actual) - item.theoretical).toFixed(3)}
                      </td>
                      <td className="border p-3 text-center">{item.count.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 期待値分析 */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">殿堂が出るまでの期待回数</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded">
                <div className="text-sm text-gray-600">理論値</div>
                <div className="text-xl font-bold">{results.expectedValues.theoretical}回</div>
                <div className="text-xs text-gray-500">1/0.002 = 500</div>
              </div>
              <div className="text-center p-3 bg-white rounded">
                <div className="text-sm text-gray-600">実測値</div>
                <div className="text-xl font-bold">{results.expectedValues.actual}回</div>
              </div>
              <div className="text-center p-3 bg-white rounded">
                <div className="text-sm text-gray-600">差異</div>
                <div className={`text-xl font-bold ${parseFloat(results.expectedValues.difference) > 50 ? 'text-red-600' : 'text-green-600'}`}>
                  ±{results.expectedValues.difference}回
                </div>
              </div>
            </div>
          </div>

          {/* 累積確率グラフ */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-3">累積確率の比較</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={results.cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="draws" />
                <YAxis label={{ value: '確率(%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value, name) => [`${value}%`, name === 'theoretical' ? '理論値' : '実測値']} />
                <Legend />
                <Line type="monotone" dataKey="theoretical" stroke="#8884d8" name="理論値" strokeWidth={2} />
                <Line type="monotone" dataKey="actual" stroke="#82ca9d" name="実測値" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 分布グラフ */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-3">殿堂出現回数の分布</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={results.distributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip formatter={(value, name) => [value, '出現回数']} />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 統計的考察 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">統計的考察</h2>
            <div className="space-y-2">
              <p><strong>大数の法則の確認:</strong> シミュレーション回数を増やすことで、実測値が理論値に近づく傾向が確認できます。</p>
              <p><strong>天井システムの効果:</strong> 600回の天井により、殿堂を引くまでの最大回数が制限されています。</p>
              <p><strong>確率の偏り:</strong> 少ないサンプル数では確率に偏りが生じやすく、十分なサンプル数が必要であることが分かります。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GachaSimulator;