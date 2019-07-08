const
    Pierre = artifacts.require('Pierre'),
    CouponMasterStorage = artifacts.require('CouponMasterStorage'),
    CouponRelationStorage = artifacts.require('CouponRelationStorage'),
    assert = require('chai').assert,
    truffleAssert = require('truffle-assertions');

contract('Pierre', accounts => {
    let _pierre, _couponMasterStorage, _couponRelationStorage;
    const _deployer = accounts[0];

    // set up
    beforeEach(async () => {
        _couponMasterStorage = await CouponMasterStorage.new({ from: _deployer });
        _couponRelationStorage = await CouponRelationStorage.new({ from: _deployer });
        _pierre = await Pierre.new(_couponMasterStorage.address, _couponRelationStorage.address, { from: _deployer });

        await _couponMasterStorage.auth(_pierre.address, { from: _deployer });
        await _couponRelationStorage.auth(_pierre.address, { from: _deployer });

        await _pierre.createCoupon(10, 10, JSON.stringify({}), { from: accounts[1] });
    });

    // tear down
    afterEach(async () => { });

    /**
     * @covers Pierre.createCoupon
     */
    it("shuold be able to create coupon", async () => {
        await truffleAssert.passes(
            _pierre.createCoupon(20, 30, JSON.stringify({ memo: 'MEMOMEMO' }), { from: accounts[2] }),
            "Create coupon"
        );

        const coupon = await _pierre.getCoupon(1);
        assert(
            coupon[0].toString() == '1' &&
            coupon[1] == accounts[2] &&
            coupon[2].toString() == '20' &&
            coupon[3].toString() == '30' &&
            coupon[4] == JSON.stringify({ memo: 'MEMOMEMO' })
        );
    });

    /**
     * @covers Pierre.getCoupon
     */
    it("should be able to get coupon", async () => {
        await truffleAssert.passes(
            _pierre.getCoupon(0),
            "Get coupon"
        );

        await _pierre.deleteCoupon(0);
        await truffleAssert.fails(
            _pierre.getCoupon(0),
            truffleAssert.ErrorType.REVERT,
            "Not found.",
            "Deleted coupon is not found."
        );

        await truffleAssert.fails(
            _pierre.getCoupon(1),
            truffleAssert.ErrorType.REVERT
        );
    });

    /**
     * @covers Pierre.disableCoupon
     */
    it("should be able to disable coupon", async () => {
        await truffleAssert.passes(
            _pierre.disableCoupon(0),
            "Disable coupon"
        );

        const coupon = await _pierre.getCoupon(0);
        assert(coupon[3].toString() == '0');
    });

    /**
     * @covers Pierre.deleteCoupon
     */
    it("should be able to delete coupon", async () => {
        let balances = {
            accounts3: {},
            accounts4: {}
        };

        balances.accounts3.init = web3.utils.fromWei(await web3.eth.getBalance(accounts[3]), 'ether');
        balances.accounts4.init = web3.utils.fromWei(await web3.eth.getBalance(accounts[4]), 'ether');

        await _pierre.exchangeCoupon(0, { from: accounts[3], value: web3.utils.toWei('10', 'ether') });
        await _pierre.exchangeCoupon(0, { from: accounts[4], value: web3.utils.toWei('10', 'ether') });
        await _pierre.useCoupon(0, { from: accounts[4] });
        balances.accounts3.before = web3.utils.fromWei(await web3.eth.getBalance(accounts[3]), 'ether');
        balances.accounts4.before = web3.utils.fromWei(await web3.eth.getBalance(accounts[4]), 'ether');

        await _couponMasterStorage.auth(_deployer, { from: _deployer });
        await _couponMasterStorage.updatePrice(0, 20, { from: _deployer });
        await _couponMasterStorage.auth(_pierre.address, { from: _deployer });
        await truffleAssert.fails(
            _pierre.deleteCoupon(0),
            truffleAssert.ErrorType.REVERT,
            "Internal error.",
            "Internal error if the refund amount is insufficient"
        );
        await _couponMasterStorage.auth(_deployer, { from: _deployer });
        await _couponMasterStorage.updatePrice(0, 10, { from: _deployer });
        await _couponMasterStorage.auth(_pierre.address, { from: _deployer });

        await truffleAssert.passes(
            _pierre.deleteCoupon(0),
            "Delete coupon"
        );

        await truffleAssert.fails(
            _pierre.getCoupon(0),
            truffleAssert.ErrorType.REVERT,
            "Not found.",
            "Deleted coupon is not found."
        );

        balances.accounts3.after = web3.utils.fromWei(await web3.eth.getBalance(accounts[3]), 'ether');
        balances.accounts4.after = web3.utils.fromWei(await web3.eth.getBalance(accounts[4]), 'ether');

        balances.accounts3.diff_init_before = balances.accounts3.before - balances.accounts3.init;
        balances.accounts3.diff_init_after = balances.accounts3.after - balances.accounts3.init;
        balances.accounts3.diff_before_after = balances.accounts3.after - balances.accounts3.before;

        balances.accounts4.diff_init_before = balances.accounts4.before - balances.accounts4.init;
        balances.accounts4.diff_init_after = balances.accounts4.after - balances.accounts4.init;
        balances.accounts4.diff_before_after = balances.accounts4.after - balances.accounts4.before;

        // console.table(balances);
        assert(balances.accounts3.diff_before_after == 10);
        assert(balances.accounts4.diff_before_after == 0);

        await truffleAssert.fails(
            _pierre.deleteCoupon(0),
            truffleAssert.ErrorType.REVERT,
            "Not found.",
            "Deleted coupon can not be deleted"
        );

        
    });

    /**
     * @covers Pierre.exchangeCoupon
     */
    it("should be able to exchange coupon", async () => {
        let balances = { accounts2: {} };
        balances.accounts2.before = web3.utils.fromWei(await web3.eth.getBalance(accounts[2]), 'ether');

        await truffleAssert.passes(
            _pierre.exchangeCoupon(0, { from: accounts[2], value: web3.utils.toWei('10', 'ether') }),
            "Exchange coupon"
        );

        balances.accounts2.after = web3.utils.fromWei(await web3.eth.getBalance(accounts[2]), 'ether');
        balances.accounts2.diff = balances.accounts2.after - balances.accounts2.before;

        // console.table(balances);
        // Consider the error due to gas cost.
        assert(balances.accounts2.diff > -10.1 && balances.accounts2.diff <= -10.0);

        await truffleAssert.fails(
            _pierre.exchangeCoupon(0, { from: accounts[2], value: web3.utils.toWei('1', 'ether') }),
            truffleAssert.ErrorType.REVERT,
            "Bad request.",
            "Bad request error if the payment amount is insufficient"
        );

        await _pierre.disableCoupon(0);
        await truffleAssert.fails(
            _pierre.exchangeCoupon(0, { from: accounts[2], value: web3.utils.toWei('10', 'ether') }),
            truffleAssert.ErrorType.REVERT,
            "Bad request.",
            "Bad request error if the remaining number is 0"
        );

        await _pierre.deleteCoupon(0);
        await truffleAssert.fails(
            _pierre.exchangeCoupon(0, { from: accounts[2], value: web3.utils.toWei('10', 'ether') }),
            truffleAssert.ErrorType.REVERT,
            "Not found.",
            "Error if the coupon has been deleted"
        );
    });

    /**
     * @covers Pierre.useCoupon
     */
    it("should be able to use coupon", async () => {
        let balances = { accounts1: {} };
        balances.accounts1.before = web3.utils.fromWei(await web3.eth.getBalance(accounts[1]), 'ether');

        await _pierre.exchangeCoupon(0, { from: accounts[2], value: web3.utils.toWei('10', 'ether') });
        await truffleAssert.passes(
            _pierre.useCoupon(0, { from: accounts[2] }),
            "Use coupon"
        );

        balances.accounts1.after = web3.utils.fromWei(await web3.eth.getBalance(accounts[1]), 'ether');
        balances.accounts1.diff = balances.accounts1.after - balances.accounts1.before;

        // console.table(balances);
        assert(balances.accounts1.diff == 10);

        await _pierre.exchangeCoupon(0, { from: accounts[2], value: web3.utils.toWei('10', 'ether') });

        await _couponMasterStorage.auth(_deployer, { from: _deployer });
        await _couponMasterStorage.updatePrice(0, 20, { from: _deployer });
        await _couponMasterStorage.auth(_pierre.address, { from: _deployer });
        await truffleAssert.fails(
            _pierre.useCoupon(0, { from: accounts[2] }),
            truffleAssert.ErrorType.REVERT,
            "Internal error.",
            "Internal error if do not hold the amount paid to the issuer"
        );
        await _couponMasterStorage.auth(_deployer, { from: _deployer });
        await _couponMasterStorage.updatePrice(0, 10, { from: _deployer });
        await _couponMasterStorage.auth(_pierre.address, { from: _deployer });

        await _pierre.deleteCoupon(0);
        await truffleAssert.fails(
            _pierre.useCoupon(0, { from: accounts[2] }),
            truffleAssert.ErrorType.REVERT,
            "Not found.",
            "Error if the coupon has been deleted"
        );
    });

    /**
     * @covers Pierre.getIssuedCouponIds
     */
    it("should be able to get issued coupon IDs", async () => {
        await _pierre.createCoupon(20, 30, JSON.stringify({}), { from: accounts[1] });
        let
            all = await _pierre.getIssuedCouponIds(0, { from: accounts[1] }),
            left = await _pierre.getIssuedCouponIds(1, { from: accounts[1] }),
            notLeft = await _pierre.getIssuedCouponIds(2, { from: accounts[1] });

        assert(all.length == 2 && all[0].toString() == '0' && all[1].toString() == '1');
        assert(left.length == 2 && left[0].toString() == '0' && left[1].toString() == '1');
        assert(notLeft.length == 0);

        await _pierre.deleteCoupon(0);
        await _pierre.disableCoupon(1);
        all = await _pierre.getIssuedCouponIds(0, { from: accounts[1] });
        left = await _pierre.getIssuedCouponIds(1, { from: accounts[1] });
        notLeft = await _pierre.getIssuedCouponIds(2, { from: accounts[1] });
        assert(all.length == 1 && all[0].toString() == '1');
        assert(left.length == 0);
        assert(notLeft.length == 1 && notLeft[0].toString() == '1');

        assert((await _pierre.getIssuedCouponIds(0, { from: accounts[0] })).length == 0);
    });

    /**
     * @covers Pierre.getOwnCouponIds
     */
    it("should be able to get own coupon IDs", async () => {
        await _pierre.createCoupon(20, 30, JSON.stringify({}), { from: accounts[1] });
        await _pierre.exchangeCoupon(1, { from: accounts[2], value: web3.utils.toWei('20', 'ether') });
        await _pierre.exchangeCoupon(0, { from: accounts[2], value: web3.utils.toWei('10', 'ether') });
        await _pierre.exchangeCoupon(1, { from: accounts[2], value: web3.utils.toWei('20', 'ether') });

        let
            all = await _pierre.getOwnCouponIds(0, { from: accounts[2] }),
            notUsed = await _pierre.getOwnCouponIds(1, { from: accounts[2] }),
            used = await _pierre.getOwnCouponIds(2, { from: accounts[2] });
        assert(all.length == 3 && all[0].toString() == '1' && all[1].toString() == '0' && all[2].toString() == '1');
        assert(notUsed.length == 3 && notUsed[0].toString() == '1' && notUsed[1].toString() == '0' && notUsed[2].toString() == '1');
        assert(used.length == 0);

        await _pierre.useCoupon(1, { from: accounts[2] });
        await _pierre.deleteCoupon(0);
        all = await _pierre.getOwnCouponIds(0, { from: accounts[2] });
        notUsed = await _pierre.getOwnCouponIds(1, { from: accounts[2] });
        used = await _pierre.getOwnCouponIds(2, { from: accounts[2] });
        assert(all.length == 2 && all[0].toString() == '1' && all[1].toString() == '1');
        assert(notUsed.length == 1 && notUsed[0].toString() == '1');
        assert(used.length == 1 && used[0].toString() == '1');
    })
});