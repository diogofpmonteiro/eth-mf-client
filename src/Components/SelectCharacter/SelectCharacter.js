import "./SelectCharacter.css";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, transformCharacterData } from "../../constants";
import myEpicGame from "../../utils/MyEpicGame.json";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";

const SelectCharacter = ({ setCharacterNFT }) => {
  const [characters, setCharacters] = useState([]);
  const [gameContract, setGameContract] = useState(null);
  const [mintingCharacter, setMintingCharacter] = useState(false);

  const mintCharacterNFTAction = async (characterId) => {
    try {
      if (gameContract) {
        setMintingCharacter(true);
        console.log("Minting character in progress...");
        const mintTxn = await gameContract.mintCharacterNFT(characterId);
        await mintTxn.wait();
        console.log("mintTxn:", mintTxn);
        setMintingCharacter(false);
      }
    } catch (error) {
      console.warn("MintCharacterAction Error:", error);
      setMintingCharacter(false);
    }
  };

  useEffect(() => {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicGame.abi, signer);

      setGameContract(gameContract);
    } else {
      console.log("Ethereum object not found");
    }
  }, []);

  // get all mint-able characters during mounting phase
  useEffect(() => {
    const getCharacters = async () => {
      try {
        console.log("Getting contract characters to mint");

        // get all mint-able characters
        const charactersTxn = await gameContract.getAllDefaultCharacters();
        console.log("characters transaction: ", charactersTxn);

        // go through all of our characters and transform the data
        const characters = charactersTxn.map((characterData) => transformCharacterData(characterData));

        setCharacters(characters);
      } catch (error) {
        console.log("Something went wrong fetching characters: ", error);
      }
    };

    // * Add a callback method that will fire when this event is received
    const onCharacterMint = async (sender, tokenId, characterIndex) => {
      console.log(`CharacterNFTMinted - sender: ${sender} tokenId: ${tokenId.toNumber()} characterIndex: ${characterIndex.toNumber()}`);

      // * Once our character NFT is minted we can fetch the metadata from our contract and set it in state to move onto the Arena
      if (gameContract) {
        const characterNFT = await gameContract.checkIfUserHasNFT();
        console.log("CharacterNFT: ", characterNFT);
        setCharacterNFT(transformCharacterData(characterNFT));
      }
    };

    if (gameContract) {
      getCharacters();

      // * Setup for NFT Minted Listener EVENT
      gameContract.on("CharacterNFTMinted", onCharacterMint);
    }

    return () => {
      // * When your component unmounts, let;s make sure to clean up this listener
      if (gameContract) {
        gameContract.off("CharacterNFTMinted", onCharacterMint);
      }
    };
  }, [gameContract, setCharacterNFT]);

  const renderCharacters = () =>
    characters.map((character, index) => (
      <div className='character-item' key={character.name}>
        <div className='name-container'>
          <p>{character.name}</p>
        </div>
        <img src={`https://cloudflare-ipfs.com/ipfs/${character.imageURI}`} alt={character.name} />
        <button type='button' className='character-mint-button' onClick={() => mintCharacterNFTAction(index)}>
          {`Mint ${character.name}`}
        </button>
      </div>
    ));

  return (
    <div className='select-character-container'>
      <h2>Mint Your Fighter. Choose wisely.</h2>
      <div className='characters-container'>{characters.length > 0 && renderCharacters()}</div>

      {mintingCharacter && (
        <div className='loading'>
          <div className='indicator'>
            <LoadingIndicator />
            <p>Minting In Progress...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectCharacter;
