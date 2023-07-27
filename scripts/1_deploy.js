async function main() {
  // Fetch contract to deploy: calls the ethers function to snag the artifacts/...json file
  const Token = await ethers.getContractFactory("Token")

  // Deploy contract
  const token = await Token.deploy()
  await token.deployed()
  console.log(`Token Deployed to: ${token.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
