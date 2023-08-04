const { ethers } = require('hardhat');
const { expect } = require('chai');

const tokens = (n) => {
	return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Token', ()=> {
	let token, accounts, deployer, receiver, exchange, receiver2

	beforeEach(async () => {
		//Fetch Token from Blockchain using ethers.js
		const Token = await ethers.getContractFactory('Token')
		token = await Token.deploy('Sage Coin', 'SAGE', '1000000')

		accounts = await ethers.getSigners()
		deployer = accounts[0]
		receiver = accounts[1]
		exchange = accounts[2]
		receiver2 = accounts[3]
	})
	describe('Deployment', () => {
		const name = 'Sage Coin'
		const symbol = 'SAGE'
		const decimals = '18'
		const totalSupply = tokens('1000000')

		it('has correct name', async () => {
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

	describe('Sending Tokens', () => {
		let amount, transaction, result

		describe('Success', () => {

			beforeEach(async () => {
				// Transfer tokens
				amount = tokens(100)
				transaction = await token.connect(deployer).transfer(receiver.address, amount)
				result = await transaction.wait()
			})

			it('transfers token balances', async () => {
				// Log balance before transfer
				// console.log("deployer balance before transfer", await token.balanceOf(deployer.address))
				// console.log("receiver balance before transfer", await token.balanceOf(receiver.address))

				// Transfer tokens
					// went to beforeEach 

				expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900))
				expect(await token.balanceOf(receiver.address)).to.equal(amount)

				// Log balance after transfer
				// console.log("deployer balance after transfer", await token.balanceOf(deployer.address))
				// console.log("receiver balance after transfer", await token.balanceOf(receiver.address))

				// Ensure that tokens were transfered (balance changed)
			})

			it('emits a transfer event', async () => {
				const event = result.events[0]
				expect(event.event).to.equal('Transfer')

				const args = event.args
				expect(args.from).to.equal(deployer.address)
				expect(args.to).to.equal(receiver.address)
				expect(args.value).to.equal(amount)
			})
		})

		describe('Failure', () => {

			it('rejects insufficient balances', async () => {
				// Transfer more tokens than deployer has = 100M
				let invalidAmount = tokens(100000000)
				await expect(token.connect(deployer).transfer(receiver.address, invalidAmount)).to.be.reverted
			})

			it('rejects invalid recipient', async () => {
				// Transfer more tokens than deployer has = 100M
				let amount = tokens(100)
				await expect(token.connect(deployer).transfer('0x0000000000000000000000000000000000000000', amount)).to.be.reverted

			})
		})
	})

	describe('Approving Tokens', () => {
		let amount, transaction, result

		beforeEach(async () => {
			amount = tokens(100)
			transaction = await token.connect(deployer).approve(exchange.address, amount)
			result = await transaction.wait()
		})

		describe('Success', () => {
			it('allocates an allowance for delegated token spending', async () => {
				expect(await token.allowance(deployer.address, exchange.address)).to.equal(amount)
			})
			it('emits a transfer event', () => {
				const event = result.events[0]
				expect(event.event).to.equal('Approval')

				const args = event.args
				expect(args.owner).to.equal(deployer.address)
				expect(args.spender).to.equal(exchange.address)
				expect(args.value).to.equal(amount)
			})
		})

		describe('Failure', () => {
			it('reject invalid senders', async () => {
				await expect(token.connect(deployer).approve('0x0000000000000000000000000000000000000000', amount)).to.be.reverted
			})
		})
	})

	describe('Delegated Token Transfers', () => {
		let amount, transaction, result

		beforeEach(async () => {
			amount = tokens(100)
			transaction = await token.connect(deployer).approve(exchange.address, amount)
			result = await transaction.wait()
		})

		describe('Success', () => {
		
			beforeEach(async () => {
				transaction = await token.connect(exchange).transferFrom(deployer.address, receiver.address, amount)
				result = await transaction.wait()
			})

			it('transfers token balances with approved exchange', async () => {
				expect(await token.balanceOf(deployer.address)).to.be.equal(ethers.utils.parseUnits('999900', 'ether'))
				expect(await token.balanceOf(receiver.address)).to.be.equal(amount)
			})

			it('resets the allowance', async () => {
				expect(await token.allowance(deployer.address, exchange.address)).to.be.equal(0)
			})

			it('emits a transfer event', () => {
				const event = result.events[0]
				expect(event.event).to.equal('Transfer')

				const args = event.args
				expect(args.from).to.equal(deployer.address)
				expect(args.to).to.equal(receiver.address)
				expect(args.value).to.equal(amount)
			})

		})

		describe('Failure', () => {
			let amount, invalidAmount, transaction, result

			beforeEach(async () => {
				invalidAmount = tokens(10000)
				amount = tokens(100)
				transaction = await token.connect(deployer).approve(exchange.address, amount)
				result = await transaction.wait()
			})
			
			it('rejects non-approved sender', async () => {
				await expect(token.connect(receiver2).transferFrom(deployer.address, receiver.address, amount)).to.be.reverted
			})

			it('rejects invalid amount', async () => {
				await expect(token.connect(exchange).transferFrom(deployer.address, receiver.address, invalidAmount)).to.be.reverted
			})

			it('rejects missing currency in the wallet', async () => {
				transaction = await token.connect(receiver).approve(exchange.address, invalidAmount)
				await expect(token.connect(exchange).transferFrom(receiver.address, deployer.address, invalidAmount)).to.be.reverted
			})
		})
	})
})
