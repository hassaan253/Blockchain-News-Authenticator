const Auditor = artifacts.require('Auditor');

module.exports = async function (deployer) {
	await deployer.deploy(Auditor);
	};
