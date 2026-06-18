import * as StellarSdk from '@stellar/stellar-sdk';
import type { Balance, SwapQuote } from '../types';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

export const USDC_ASSET = new StellarSdk.Asset(
  'USDC',
  'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
);
export const XLM_ASSET = StellarSdk.Asset.native();
export const server = new StellarSdk.Horizon.Server(HORIZON_URL);

export async function fetchBalances(address: string): Promise<Balance[]> {
  try {
    const account = await server.loadAccount(address);
    const results: Balance[] = [];
    for (const b of account.balances) {
      if (b.asset_type === 'native') {
        results.push({ asset: 'XLM', amount: parseFloat(b.balance).toFixed(4), assetCode: 'XLM' });
      } else if (b.asset_type === 'credit_alphanum4' || b.asset_type === 'credit_alphanum12') {
        const ba = b as StellarSdk.Horizon.HorizonApi.BalanceLineAsset;
        results.push({
          asset: `${ba.asset_code}:${ba.asset_issuer}`,
          amount: parseFloat(ba.balance).toFixed(4),
          assetCode: ba.asset_code,
          assetIssuer: ba.asset_issuer,
        });
      }
    }
    return results;
  } catch (e) {
    console.error('fetchBalances error', e);
    return [];
  }
}

export async function buildSendTx(
  sourceAddress: string,
  destination: string,
  amount: string,
  assetCode: string,
  assetIssuer?: string,
  memo?: string
): Promise<string> {
  const asset = assetCode === 'XLM' ? XLM_ASSET : new StellarSdk.Asset(assetCode, assetIssuer!);
  const sourceAccount = await server.loadAccount(sourceAddress);
  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(StellarSdk.Operation.payment({ destination, asset, amount }))
    .addMemo(memo ? StellarSdk.Memo.text(memo) : StellarSdk.Memo.none())
    .setTimeout(180)
    .build();
  return tx.toXDR();
}

export interface SwapQuoteResult extends SwapQuote {
  pathAssets: StellarSdk.Asset[];
}

export async function getSwapQuote(
  fromAssetCode: string,
  toAssetCode: string,
  amount: string,
  fromIssuer?: string,
  toIssuer?: string
): Promise<SwapQuoteResult | null> {
  try {
    const sendAsset = fromAssetCode === 'XLM' ? XLM_ASSET : new StellarSdk.Asset(fromAssetCode, fromIssuer!);
    const destAsset = toAssetCode === 'XLM' ? XLM_ASSET : new StellarSdk.Asset(toAssetCode, toIssuer!);

    const paths = await server.strictSendPaths(sendAsset, amount, [destAsset]).call();
    if (!paths.records.length) return null;

    const best = paths.records[0];
    const rate = (parseFloat(best.destination_amount) / parseFloat(amount)).toFixed(6);

    const pathAssets: StellarSdk.Asset[] = best.path.map(
      (p: { asset_type: string; asset_code?: string; asset_issuer?: string }) =>
        p.asset_type === 'native'
          ? StellarSdk.Asset.native()
          : new StellarSdk.Asset(p.asset_code!, p.asset_issuer!)
    );

    return {
      fromAsset: fromAssetCode,
      toAsset: toAssetCode,
      fromAmount: amount,
      toAmount: parseFloat(best.destination_amount).toFixed(4),
      rate,
      path: pathAssets.map(a => (a.isNative() ? 'XLM' : a.getCode())),
      pathAssets,
    };
  } catch (e) {
    console.error('getSwapQuote error', e);
    return null;
  }
}

export async function buildSwapTx(
  sourceAddress: string,
  fromAssetCode: string,
  toAssetCode: string,
  amount: string,
  minReceive: string,
  pathAssets: StellarSdk.Asset[],
  fromIssuer?: string,
  toIssuer?: string
): Promise<string> {
  const sendAsset = fromAssetCode === 'XLM' ? XLM_ASSET : new StellarSdk.Asset(fromAssetCode, fromIssuer!);
  const destAsset = toAssetCode === 'XLM' ? XLM_ASSET : new StellarSdk.Asset(toAssetCode, toIssuer!);

  const sourceAccount = await server.loadAccount(sourceAddress);
  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.pathPaymentStrictSend({
        sendAsset,
        sendAmount: amount,
        destination: sourceAddress,
        destAsset,
        destMin: minReceive,
        path: pathAssets,
      })
    )
    .setTimeout(180)
    .build();
  return tx.toXDR();
}

// Submit by POSTing the signed XDR directly to Horizon — avoids SDK re-wrapping bugs
export async function submitTx(signedXdr: string): Promise<{ hash: string }> {
  const body = new URLSearchParams({ tx: signedXdr });
  const res = await fetch(`${HORIZON_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const json = await res.json();

  if (!res.ok) {
    // Pull the most useful detail out of the Horizon error envelope
    const codes = json?.extras?.result_codes;
    if (codes) {
      const ops = Array.isArray(codes.operations) ? codes.operations.join(', ') : '';
      const tx = codes.transaction ?? '';
      throw new Error(`Horizon error — tx: ${tx}${ops ? `, op: ${ops}` : ''}`);
    }
    throw new Error(json?.title ?? json?.detail ?? `HTTP ${res.status}`);
  }

  return { hash: json.hash };
}

export function generatePaymentLink(
  address: string,
  amount: string,
  asset: string,
  memo?: string
): string {
  const base = window.location.origin;
  const params = new URLSearchParams({ to: address, amount, asset });
  if (memo) params.set('memo', memo);
  return `${base}/pay?${params.toString()}`;
}

export function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-6)}`;
}
