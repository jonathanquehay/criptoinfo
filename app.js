const MIN_ORDER_SIZE = 10;

const getOrderBlockInfo = async (symbol) => {
  const limit = document.getElementById('limit-select').value;
  const response = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}USDT&limit=${limit}`);
  const data = await response.json();

  const bids = data.bids.map((bid) => [parseFloat(bid[0]), parseFloat(bid[1])]);
  const asks = data.asks.map((ask) => [parseFloat(ask[0]), parseFloat(ask[1])]);

  const totalBidSize = bids.reduce((total, bid) => total + bid[1], 0);
  const totalAskSize = asks.reduce((total, ask) => total + ask[1], 0);

  const weightedBidPrice = bids.reduce((total, bid) => total + (bid[0] * bid[1]), 0) / totalBidSize;
  const weightedAskPrice = asks.reduce((total, ask) => total + (ask[0] * ask[1]), 0) / totalAskSize;

  const [minBidSize, maxBidPrice] = bids.reduce(([minSize, maxPrice], bid) => {
    if (minSize >= MIN_ORDER_SIZE) {
      return [minSize, maxPrice];
    }

    const [price, size] = bid;
    const newSize = minSize + size;

    if (newSize >= MIN_ORDER_SIZE) {
      const weightedPrice = ((minSize * maxPrice) + (size * price)) / newSize;
      return [newSize, weightedPrice];
    }

    return [newSize, price];
  }, [0, 0]);

  const [minAskSize, minAskPrice] = asks.reduce(([minSize, minPrice], ask) => {
    if (minSize >= MIN_ORDER_SIZE) {
      return [minSize, minPrice];
    }

    const [price, size] = ask;
    const newSize = minSize + size;

    if (newSize >= MIN_ORDER_SIZE) {
      const weightedPrice = ((minSize * minPrice) + (size * price)) / newSize;
      return [newSize, weightedPrice];
    }

    return [newSize, price];
  }, [0, Infinity]);

  const bidSizeFormatted = `${totalBidSize.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
  const askSizeFormatted = `${totalAskSize.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;


  const bidPriceFormatted = `$${weightedBidPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const askPriceFormatted = `$${weightedAskPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const porc_ganacia = ((weightedAskPrice - weightedBidPrice) / weightedAskPrice) * 100;
  let message = '';

  if (minBidSize >= MIN_ORDER_SIZE || minAskSize >= MIN_ORDER_SIZE) {
    message += `<table>`;
    message += `<thead>`;
    message += `<tr><th>OB</th><th>Total</th><th>Cantidad</th><th>Precio</th></tr>`;
    message += `</thead>`;
    message += `<tbody>`;
  }

  if (minBidSize >= MIN_ORDER_SIZE) {
    message += `<tr>`;
    message += `<td style="color: green; font-weight: bold;">Compra</td>`;
    message += `<td>${bidSizeFormatted}</td>`;
    message += `<td>${minBidSize.toFixed(2)} ${symbol}</td>`;
    message += `<td style="color: green; font-weight: bold;">${bidPriceFormatted}</td>`;
    message += `</tr>`;
  }

  if (minAskSize >= MIN_ORDER_SIZE) {
    message += `<tr>`;
    message += `<td style="color: red; font-weight: bold;">Venta</td>`;
    message += `<td>${askSizeFormatted}</td>`;
    message += `<td>${minAskSize.toFixed(2)} ${symbol}</td>`;
    message += `<td style="color: red; font-weight: bold;">${askPriceFormatted}</td>`;
    message += `</tr>`;
  }

  if (minBidSize >= MIN_ORDER_SIZE || minAskSize >= MIN_ORDER_SIZE) {
    message += `</tbody>`;
    message += `</table>`;
    message += `<h6>Porcentaje esperado ganancia: <h2>${porc_ganacia.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %</h2></h6>`;
  }

  if (message === '') {
    message = `<p>SIN OB EN ${symbol}.</p>`;
  }

  document.getElementById('order-block-info').innerHTML = message;

};

const input = document.getElementById('symbol-input');
input.addEventListener('change', () => {
  const symbol = input.value.toUpperCase();
  getOrderBlockInfo(symbol);
});

const limitSelect = document.getElementById('limit-select');
limitSelect.addEventListener('change', () => {
  const symbol = document.getElementById('symbol-input').value.toUpperCase();
  getOrderBlockInfo(symbol);
});

const getTopCryptos = async () => {
  const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
  const data = await response.json();

  const topCryptos = data
    .filter(crypto => crypto.symbol.endsWith('USDT'))
    .filter(crypto => parseFloat(crypto.lastPrice) >= 0.5 && parseFloat(crypto.lastPrice) <= 30000) // filtro por rango de precios
    .sort((a, b) => parseFloat(b.lastPrice) - parseFloat(a.lastPrice));
  // .slice(0, 500);

  let message = '';
  message += '<ul>';

  topCryptos.forEach(crypto => {
    const price = parseFloat(crypto.lastPrice).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    const changeCell = parseFloat(crypto.priceChangePercent).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const color = (changeCell > -1.5 && changeCell < 1) ? 'color: red; font-weight: bold;font-size:1.5em;' : '';
    message += `<li>${crypto.symbol.slice(0, -4)} - ${price} <span style="${color}">(${changeCell}%)</span> <button onclick="openTradingView('${crypto.symbol.slice(0, -4)}')">&#128200;</button></li>`;
  });

  message += '</ul>';

  document.getElementById('top-cryptos').innerHTML = message;
};

const openTradingView = (symbol) => {
  const tradingViewUrl = `https://www.tradingview.com/chart/?symbol=BINANCE:${symbol}USDT`;
  window.open(tradingViewUrl, '_blank');
  // window.open(`https://www.tradingview.com/symbols/${symbol}USDT`, '_blank');
}
getTopCryptos();


document.addEventListener('keydown', function (event) {
  if (event.key === ' ') {
    event.preventDefault(); // Previene la acción predeterminada de la tecla "t"
    window.scrollTo(0, 0); // Lleva al usuario al principio de la página
    document.getElementById('symbol-input').value = "";
    document.getElementById('symbol-input').focus(); // Coloca el foco en el input de búsqueda
  }
});