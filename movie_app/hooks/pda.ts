import { web3 } from "@coral-xyz/anchor";

const PROGRAM_ID = new web3.PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ||
    "ApfCLKKr7Y6GX9qKWujhDGmSNvdN93tNidyPe2hyB9jL"
);

export function getPlatformConfigPDA(): [web3.PublicKey, number] {
  const [pda, bump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("platform-config")],
    PROGRAM_ID
  );
  return [pda, bump];
}

export function getBronzeCollectionPDA(): [web3.PublicKey, number] {
  const [pda, bump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("bronze-collection")],
    PROGRAM_ID
  );
  return [pda, bump];
}

export function getSilverCollectionPDA(): [web3.PublicKey, number] {
  const [pda, bump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("silver-collection")],
    PROGRAM_ID
  );
  return [pda, bump];
}

export function getGoldCollectionPDA(): [web3.PublicKey, number] {
  const [pda, bump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("gold-collection")],
    PROGRAM_ID
  );
  return [pda, bump];
}

export function getCollectionPDA(tier: number): [web3.PublicKey, number] {
  switch (tier) {
    case 0:
      return getBronzeCollectionPDA();
    case 1:
      return getSilverCollectionPDA();
    case 2:
      return getGoldCollectionPDA();
    default:
      throw new Error(`Invalid tier: ${tier}`);
  }
}

export function getMemberPassPDA(
  userPublicKey: web3.PublicKey | string
): [web3.PublicKey, number] {
  const pubkey =
    typeof userPublicKey === "string"
      ? new web3.PublicKey(userPublicKey)
      : userPublicKey;

  const [pda, bump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("member_pass"), pubkey.toBuffer()],
    PROGRAM_ID
  );
  return [pda, bump];
}

export function getTreasurePDA(): [web3.PublicKey, number] {
  const [pda, bump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    PROGRAM_ID
  );
  return [pda, bump];
}
