import { ethers } from 'ethers';

module.exports = {
  // Upload to IPFS
  uploadToIPFS: async (payload, logger) => {
    const enableLogs = 0;

    return new Promise(async (resolve, reject) => {
      // Stringify it
      const jsonizedPayload = JSON.stringify(payload);

      const ipfs = require("nano-ipfs-store").at("https://ipfs.infura.io:5001");
      ipfs
        .add(jsonizedPayload)
        .then(ipfshash => {
          if (enableLogs) logger.info("Success --> uploadToIPFS(): ", ipfshash);
          resolve(ipfshash);
        })
        .catch (err => {
          if (enableLogs) logger.error("!!!Error --> uploadToIPFS(): ", err);
          reject(err);
        });
    });
  },
  // Get Interactable Contracts
  getInteractableContracts: (network, apiKeys, walletPK, deployedContract, deployedContractABI) => {
    const enableLogs = 0;

    const provider = ethers.getDefaultProvider(network, {
      etherscan: (apiKeys.etherscanAPI ? apiKeys.etherscanAPI : null),
      infura: (apiKeys.infuraAPI ? {projectId: apiKeys.infuraAPI.projectID, projectSecret: apiKeys.infuraAPI.projectSecret} : null),
      alchemy: (apiKeys.alchemyAPI ? apiKeys.alchemyAPI : null),
    });

    const wallet = new ethers.Wallet(walletPK, provider);
    const contract = new ethers.Contract(deployedContract, deployedContractABI, provider);
    const contractWithSigner = contract.connect(wallet);

    return({
      provider: provider,
      contract: contract,
      signingContract: contractWithSigner,
    });
  },
  // Send Notification to EPNS Contract
  sendNotification: async (
    signingContract,
    recipientAddr,
    notificationType,
    notificationStorageType,
    notificationStoragePointer,
    waitForTx,
    logger
  ) => {
    const enableLogs = 0;

    return new Promise((resolve, reject) => {
      // Create Transaction
      const identity = notificationType + "+" + notificationStoragePointer;
      const identityBytes = ethers.utils.toUtf8Bytes(identity);

      const txPromise = signingContract.sendNotification(recipientAddr, identityBytes);

      txPromise
        .then(async function(tx) {
          if (enableLogs) logger.info("Transaction sent: %o", tx);

          if (waitForTx) {
            await tx.wait(waitForTx);
          }

          if (enableLogs) logger.info("Transaction mined: %o | Notification Sent", tx.hash);

          resolve(tx);
        })
        .catch(err => {
          if (enableLogs) logger.error("Unable to complete transaction, error: %o", err);

          reject("Unable to complete transaction, error: %o", err);
        });
    });
  },
  // Prepare Payload for Notification
  preparePayload: async (recipientAddr, payloadType, title, body, payloadTitle, payloadMsg, payloadCTA, payloadImg) => {
    const enableLogs = 0;

    return new Promise((resolve, reject) => {
      let ntitle = title.toString();
      let nbody = body.toString();

      let dtype = payloadType.toString();
      let dsecret = "";
      let dsub = payloadTitle ? payloadTitle.toString() : "";
      let dmsg = payloadMsg ? payloadMsg.toString() : "";
      let dcta = payloadCTA ? payloadCTA.toString() : "";
      let dimg = payloadImg ? payloadImg.toString() : "";

      const payload = {
        "notification": {
          "title": ntitle,
          "body": nbody
        },
        "data": {
          "type": dtype,
          "secret": dsecret,
          "asub": dsub,
          "amsg": dmsg,
          "acta": dcta,
          "aimg": dimg
        }
      };

      resolve(payload);
    });
  }
}
