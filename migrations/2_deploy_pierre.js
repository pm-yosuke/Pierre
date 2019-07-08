const
    Pierre = artifacts.require('Pierre'),
    CouponMasterStorage = artifacts.require('CouponMasterStorage'),
    CouponRelationStorage = artifacts.require('CouponRelationStorage');

module.exports = function (deployer) {
    deployer
        .deploy(CouponMasterStorage)
        .then(function () {
            return deployer.deploy(CouponRelationStorage);
        })
        .then(function () {
            return deployer.deploy(
                Pierre,
                CouponMasterStorage.address,
                CouponRelationStorage.address
            );
        });
}
