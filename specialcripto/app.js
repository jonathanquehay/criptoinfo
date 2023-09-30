function getTop25() {
  fetch('https://api.binance.com/api/v3/ticker/24hr')
    .then(response => {
      return response.json();
    })
    .then(data => {
      const filteredData = data.filter(coin => coin.symbol.endsWith('USDT')).sort((a, b) => b.lastPrice - a.lastPrice);
      const top25 = filteredData.slice(0, 150);
      const tableBody = document.querySelector('#table-body');

      tableBody.innerHTML = '';

      top25.forEach(async coin => {
        const row = document.createElement('tr');
        const nameCell = document.createElement('td');
        const priceCell = document.createElement('td');
        const volumeCell = document.createElement('td');
        const changeCell = document.createElement('td');
        const buyMaxCell = document.createElement('td');
        const sellMaxCell = document.createElement('td');
        const chartCell = document.createElement('td');
        const trendCell = document.createElement('td');
        const chartButton = document.createElement('button');

        nameCell.textContent = coin.symbol;
        priceCell.textContent = parseFloat(coin.lastPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        volumeCell.textContent = parseFloat(coin.volume).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        changeCell.textContent = parseFloat(coin.priceChangePercent).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';

        const orderBookResponse = await fetch(`https://api.binance.com/api/v3/depth?symbol=${coin.symbol}&limit=300`);
        const orderBook = await orderBookResponse.json();
        const bids = orderBook.bids;
        const asks = orderBook.asks;
        const maxBid = bids.reduce((acc, cur) => Number(cur[1]) > Number(acc[1]) ? cur : acc, bids[0]);
        const maxAsk = asks.reduce((acc, cur) => Number(cur[1]) > Number(acc[1]) ? cur : acc, asks[0]);
        const buyMaxPrice = maxBid ? parseFloat(maxBid[0]).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
        const sellMaxPrice = maxAsk ? parseFloat(maxAsk[0]).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';

        buyMaxCell.textContent = buyMaxPrice;
        sellMaxCell.textContent = sellMaxPrice;
        buyMaxCell.classList.add('buyMaxCell');
        sellMaxCell.classList.add('sellMaxCell');

        const trend = calculateTrend(bids, asks);
        trendCell.textContent = trend;
        trendCell.style.color = trend === 'Alcista' ? 'green' : 'red';

        chartButton.classList.add('chart-button');
        chartButton.textContent = 'Ver gráfico';
        chartButton.addEventListener('click', () => {
          const tradingViewUrl = `https://www.tradingview.com/chart/?symbol=BINANCE:${coin.symbol}`;
          window.open(tradingViewUrl, '_blank');
        });

        chartCell.appendChild(chartButton);

        row.appendChild(nameCell);
        row.appendChild(priceCell);
        row.appendChild(volumeCell);
        row.appendChild(changeCell);
        row.appendChild(buyMaxCell);
        row.appendChild(sellMaxCell);
        row.appendChild(chartCell);
        row.appendChild(trendCell);

        tableBody.appendChild(row);
      });
    })
    .catch(error => {
      console.log(error);
    });
}

//Busqueda cada que el usuario teclee
const searchInput = document.querySelector('#search-input');
searchInput.addEventListener('input', filterCoins);

// Actualizar los datos cada minuto
setInterval(() => {
  getTop25();
  searchInput.focus();
}, 60000);

getTop25();


function calculateTrend(bids, asks) {
  let buyTotal = 0;
  let sellTotal = 0;
  const maxBids = bids.slice(0, 5);
  const maxAsks = asks.slice(0, 5);

  maxBids.forEach(bid => {
    const price = parseFloat(bid[0]);
    const quantity = parseFloat(bid[1]);
    buyTotal += price * quantity;
  });

  maxAsks.forEach(ask => {
    const price = parseFloat(ask[0]);
    const quantity = parseFloat(ask[1]);
    sellTotal += price * quantity;
  });

  if (buyTotal > sellTotal) {
    return 'Alcista';
  } else if (sellTotal > buyTotal) {
    return 'Bajista';
  } else {
    return 'Indefinido';
  }
}
// Función para filtrar por nombre de criptomoneda
function filterCoins(event) {
  const searchText = event.target.value.toUpperCase();
  const tableBody = document.querySelector('#table-body');
  const rows = tableBody.getElementsByTagName('tr');
  for (let row of rows) {
    const name = row.getElementsByTagName('td')[0];

    if (name) {
      const text = name.textContent.toUpperCase();

      if (text.indexOf(searchText) > -1) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    }
  }
}






