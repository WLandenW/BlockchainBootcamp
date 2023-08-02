const { ethers } = require('hardhat');
const { expect } = require('chai');

const tokens = (n) => {
	return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Token', ()=> {
	let token, accounts, deployer

	beforeEach(async () => {
		//Fetch Token from Blockchain using ethers.js
		const Token = await ethers.getContractFactory('Token')
		token = await Token.deploy('Sage Coin', 'SAGE', '1000000')

		accounts = await ethers.getSigners()
		deployer = accounts[0]
	})
	describe('Deployment', () => {
		const name = 'Sage Coin'
		const symbol = 'SAGE'
		const decimals = '18'
		const totalSupply = tokens('1000000')

		it('has correct name', async () => {
			// Read token name
			// const name = await token.name()
			// Check that name is correct using chai expect
			expect(await token.name()).to.equal(name)
		})
	
		it('has correct symbol', async () => {
			expect(await token.symbol()).to.equal(symbol)
		})
	
		it('has correct decimals', async () => {
			expect(await token.decimals()).to.equal(decimals)
		})
	
		it('has correct total supply', async () => {
			expect(await token.totalSupply()).to.equal(totalSupply)
		})

		it('assigns total supply to developer', async () => {
			expect(await token.balanceOf(deployer.address)).to.equal(totalSupply)
		})
	})
})
