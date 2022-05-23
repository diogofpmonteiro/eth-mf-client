import twitterLogo from "./assets/twitter-logo.svg";
import "./App.css";

import { useEffect, useState } from "react";
import { ethers } from "ethers";

import SelectCharacter from "./Components/SelectCharacter/SelectCharacter";
import Arena from "./Components/Arena/Arena";
import LoadingIndicator from "./Components/LoadingIndicator/LoadingIndicator";

import { CONTRACT_ADDRESS, transformCharacterData } from "./constants";
import myEpicGame from "./utils/MyEpicGame.json";

// Constants
const TWITTER_HANDLE = "diegoosan_";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [characterNFT, setCharacterNFT] = useState();
  const [isLoading, setIsLoading] = useState(false);

  // const checkNetwork = async () => {
  //   try {
  //     if (window.ethereum.networkVersion !== "4") {
  //       alert("Please connect to Rinkeby!");
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  const checkIfWalletIsConnected = async () => {
    try {
      // * First make sure we have access to window.ethereum
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have MetaMask!");
        setIsLoading(false);
        return;
      } else {
        console.log("We have the ethereum object", ethereum);

        // * Check if we're authorized to access the user's wallet
        const accounts = await ethereum.request({ method: "eth_accounts" });

        // * User can have multiple authorized accounts, we grab the first one if its there!
        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found an authorized account:", account);
          setCurrentAccount(account);
        } else {
          console.log("No authorized account found");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  // * connectWallet method
  const connectWalletAction = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      // * Fancy method to request access to account.
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      // * Boom! This should print out public address once we authorize Metamask.
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  // check if user has wallet connected to the correct network
  useEffect(() => {
    setIsLoading(true);
    checkIfWalletIsConnected();
    // checkNetwork();s
  }, []);

  // check if user has game nft
  useEffect(() => {
    // * The function we will call that interacts with out smart contract
    const fetchNFTMetadata = async () => {
      console.log("Checking for Character NFT on address:", currentAccount);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicGame.abi, signer);

      const response = await gameContract.checkIfUserHasNFT();
      if (response.name) {
        console.log("User has character NFT");
        setCharacterNFT(transformCharacterData(response));
      } else {
        console.log("No character NFT found");
      }
    };

    setIsLoading(false);

    // * We only want to run this, if we have a connected wallet
    if (currentAccount) {
      console.log("CurrentAccount:", currentAccount);
      fetchNFTMetadata();
    }
  }, [currentAccount]);

  // Render Methods
  const renderContent = () => {
    if (isLoading) {
      return <LoadingIndicator />;
    }

    // if user's wallet is not connected
    if (!currentAccount) {
      return (
        <div className='connect-wallet-container'>
          <img src='https://64.media.tumblr.com/tumblr_mbia5vdmRd1r1mkubo1_500.gifv' alt='Monty Python Gif' />
          <button className='cta-button connect-wallet-button' onClick={connectWalletAction}>
            Connect Wallet
          </button>
        </div>
      );
      // if user wallet is connected but user does not have the NFT
    } else if (currentAccount && !characterNFT) {
      return <SelectCharacter setCharacterNFT={setCharacterNFT} />;
      // if user is connected and has the NFT
    } else if (currentAccount && characterNFT) {
      return <Arena characterNFT={characterNFT} setCharacterNFT={setCharacterNFT} currentAccount={currentAccount} />;
    }
  };

  return (
    <div className='App'>
      <div className='container'>
        <div className='header-container'>
          <p className='header gradient-text'>⚔️ Medieval Fighters ⚔️</p>
          <p className='sub-text'>Team up to protect the Metaverse!</p>
          <div className='connect-wallet-container'>{renderContent()}</div>
        </div>
        <div className='footer-container'>
          <img alt='Twitter Logo' className='twitter-logo' src={twitterLogo} />
          <a
            className='footer-text'
            href={TWITTER_LINK}
            target='_blank'
            rel='noreferrer'>{`built with buildspace, by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
