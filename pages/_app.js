import '@/styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'

import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import {
  polygonMumbai,
} from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient } = configureChains(
  [polygonMumbai],
  [publicProvider()]);

const { connectors } = getDefaultWallets({
  appName: 'CryptoDevs DAO',
  projectId: '9b5af9fafa9878bc39cbed50a34e1b60',
  chains
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
})
  

export default function App({ Component, pageProps }) {
  return (
    <WagmiConfig config={wagmiConfig}>
    <RainbowKitProvider chains={chains}>
      <Component {...pageProps} />
    </RainbowKitProvider>
  </WagmiConfig>
  )
}
