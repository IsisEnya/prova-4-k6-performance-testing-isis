import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/latest/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getCatFactDuration = new Trend('get_cat_fact', true);
export const RateContentOK = new Rate('content_OK');

export const options = {
  stages: [
    { duration: '1m', target: 7 },     // Inicia com 7 VUs
    { duration: '1m30s', target: 92 }, // Sobe até o máximo de 92 VUs
    { duration: '1m', target: 0 }      // Encerra (total: 3m30s = 3,5 min)
  ],
  thresholds: {
    http_req_duration: ['p(90)<6800'], // 90% abaixo de 6800ms
    http_req_failed: ['rate<0.25'],    // Menos de 25% de erro
    content_OK: ['rate>0.75']          // Ao menos 75% com status 200
  }
};

export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

export default function () {
  // Se quiser testar o endpoint JSON real da Cat Fact API, use: 'https://catfact.ninja/fact'
  const url = 'https://freepublicapis.com/cat-fact-api';

  const res = http.get(url, {
    headers: { Accept: 'application/json' },
    timeout: '10s'
  });

  getCatFactDuration.add(res.timings.duration);
  RateContentOK.add(res.status === 200);

  check(res, {
    'GET Cat Fact API - Status 200': () => res.status === 200
  });

  sleep(1);
}