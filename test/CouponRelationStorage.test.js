const
    CouponRelationStorage = artifacts.require('CouponRelationStorage'),
    assert = require('chai').assert,
    truffleAssert = require('truffle-assertions');

contract('CouponRelationStorage', accounts => {
    let _couponRelationStorage;
    const _deployer = accounts[0];

    // set up
    beforeEach(async () => {
        _couponRelationStorage = await CouponRelationStorage.new({ from: _deployer });
        await _couponRelationStorage.create(0, accounts[2], { from: _deployer });
        await _couponRelationStorage.auth(accounts[1], { from: _deployer });
    });

    // tear down
    afterEach(async () => { });

    /**
     * @covers CouponRelationStorage.auth
     */
    it("should be able to change auth address by deployer", async () => {
        await truffleAssert.passes(
            _couponRelationStorage.auth(accounts[2], { from: _deployer }),
            "Deployer can execute auth()"
        );
        assert(await _couponRelationStorage.getAuthAddr() == accounts[2]);
        await truffleAssert.fails(
            _couponRelationStorage.auth(accounts[1], { from: accounts[1] }),
            truffleAssert.ErrorType.REVERT,
            "Access denied.",
            "Others can't execute auth()"
        );
    });

    /**
     * @covers CouponRelationStorage.create
     */
    it("should be able to create relation by auth address", async () => {
        const
            couponId = 1,
            userAddress = accounts[3];

        await truffleAssert.fails(
            _couponRelationStorage.create(couponId, userAddress, { from: _deployer }),
            truffleAssert.ErrorType.REVERT,
            "Access denied.",
            "Not authed address can't execute create()"
        );
        await truffleAssert.passes(
            _couponRelationStorage.create(couponId, userAddress, { from: accounts[1] }),
            "Authed address can execute create()"
        );

        const relation = await _couponRelationStorage.get(1, { from: accounts[1] });
        assert(
            relation.couponId == couponId &&
            relation.userAddress == userAddress &&
            !relation.isUsed
        );

        const userRelationIds = await _couponRelationStorage.getRelationIdsByUser(userAddress, { from: accounts[1] });
        assert(userRelationIds.length == 1 && userRelationIds[0].toString() == "1");

        const couponRelationIds = await _couponRelationStorage.getRelationIdsByCoupon(couponId, { from: accounts[1] });
        assert(couponRelationIds.length == 1 && couponRelationIds[0].toString() == "1");
    });

    /**
     * @covers CouponRelationStorage.get
     */
    it("should be able to get relation by auth address", async () => {
        await truffleAssert.fails(
            _couponRelationStorage.get(0, { from: _deployer }),
            truffleAssert.ErrorType.REVERT,
            "Access denied.",
            "Not authed address can't execute get()"
        );
        await truffleAssert.passes(
            _couponRelationStorage.get(0, { from: accounts[1] }),
            "Authed address can execute get()"
        );
    });

    /**
     * @covers CouponRelationStorage.update
     */
    it("should be able to update relation by auth address", async () => {
        const
            couponId = 1,
            userAddress = accounts[3],
            isUsed = true;

        await truffleAssert.fails(
            _couponRelationStorage.update(0, couponId, userAddress, isUsed, { from: _deployer }),
            truffleAssert.ErrorType.REVERT,
            "Access denied.",
            "Not authed address can't execute update()"
        );
        await truffleAssert.passes(
            _couponRelationStorage.update(0, couponId, userAddress, isUsed, { from: accounts[1] }),
            "Authed address can execute update()"
        );

        const relation = await _couponRelationStorage.get(0, { from: accounts[1] });
        assert(
            relation.couponId == couponId &&
            relation.userAddress == userAddress &&
            !!relation.isUsed
        );

        const
            userRelationIds2 = await _couponRelationStorage.getRelationIdsByUser(accounts[2], { from: accounts[1] }),
            userRelationIds3 = await _couponRelationStorage.getRelationIdsByUser(userAddress, { from: accounts[1] });
        assert(userRelationIds2.length == 0);
        assert(userRelationIds3.length == 1 && userRelationIds3[0].toString() == "0");

        const
            couponRelationIds0 = await _couponRelationStorage.getRelationIdsByCoupon(0, { from: accounts[1] }),
            couponRelationIds1 = await _couponRelationStorage.getRelationIdsByCoupon(1, { from: accounts[1] });
        assert(couponRelationIds0.length == 0);
        assert(couponRelationIds1.length == 1 && couponRelationIds1[0].toString() == "0");
    });

    /**
     * @covers CouponRelationStorage.deletee
     */
    it("should be able to delete relation by auth address", async () => {
        await truffleAssert.fails(
            _couponRelationStorage.deletee(0, { from: _deployer }),
            truffleAssert.ErrorType.REVERT,
            "Access denied.",
            "Not authed address can't execute deletee()"
        );
        await truffleAssert.passes(
            _couponRelationStorage.deletee(0, { from: accounts[1] }),
            "Authed address can execute deletee()"
        );

        const master = await _couponRelationStorage.get(0, { from: accounts[1] });
        assert(
            master.couponId == 0 &&
            master.userAddress == '0x' + '0'.repeat(40) &&
            !master.isUsed
        );

        const userMasterIds = await _couponRelationStorage.getRelationIdsByUser(accounts[2], { from: accounts[1] });
        assert(userMasterIds.length == 0);

        const couponMasterIds = await _couponRelationStorage.getRelationIdsByCoupon(0, { from: accounts[1] });
        assert(couponMasterIds.length == 0);
    });

    /**
     * @covers CouponRelationStorage.getRelationIdsByUser
     */
    it("should be able to get relation IDs by the user exchanged by auth address", async () => {
        await truffleAssert.fails(
            _couponRelationStorage.getRelationIdsByUser(accounts[2], { from: _deployer }),
            truffleAssert.ErrorType.REVERT,
            "Access denied.",
            "Not authed address can't execute getRelationIdsByUser()"
        );
        await truffleAssert.passes(
            _couponRelationStorage.getRelationIdsByUser(accounts[2], { from: accounts[1] }),
            "Authed address can execute getRelationIdsByUser()"
        );

        const
            userRelationIds0 = await _couponRelationStorage.getRelationIdsByUser(accounts[0], { from: accounts[1] }),
            userRelationIds2 = await _couponRelationStorage.getRelationIdsByUser(accounts[2], { from: accounts[1] });
        assert(userRelationIds0.length == 0);
        assert(userRelationIds2.length == 1 && userRelationIds2[0].toString() == '0');
    });

    /**
     * @covers CouponRelationStorage.getRelationIdsByCoupon
     */
    it("should be able to get relation IDs by the Coupon ID by auth address", async () => {
        await truffleAssert.fails(
            _couponRelationStorage.getRelationIdsByCoupon(0, { from: _deployer }),
            truffleAssert.ErrorType.REVERT,
            "Access denied.",
            "Not authed address can't execute getRelationIdsByCoupon()"
        );
        await truffleAssert.passes(
            _couponRelationStorage.getRelationIdsByCoupon(0, { from: accounts[1] }),
            "Authed address can execute getRelationIdsByCoupon()"
        );

        const
            couponRelationIds0 = await _couponRelationStorage.getRelationIdsByCoupon(0, { from: accounts[1] }),
            couponRelationIds1 = await _couponRelationStorage.getRelationIdsByCoupon(1, { from: accounts[1] });
        assert(couponRelationIds0.length == 1 && couponRelationIds0[0].toString() == '0');
        assert(couponRelationIds1.length == 0);
    });

    /**
     * @covers CouponRelationStorage.updateCouponId
     */
    it("should be able to update coupon ID by auth address", async () => {
        const couponId = 1;
        await truffleAssert.fails(
            _couponRelationStorage.updateCouponId(0, couponId, { from: _deployer }),
            truffleAssert.ErrorType.REVERT,
            "Access denied.",
            "No authed address can't execute updateCouponId()"
        );
        await truffleAssert.passes(
            _couponRelationStorage.updateCouponId(0, couponId, { from: accounts[1] }),
            "Authed address can execute updateCouponId()"
        );

        const relation = await _couponRelationStorage.get(0, { from: accounts[1] });
        assert(relation.couponId == couponId);

        const
            couponRelationIds0 = await _couponRelationStorage.getRelationIdsByCoupon(0, { from: accounts[1] }),
            couponRelationIds1 = await _couponRelationStorage.getRelationIdsByCoupon(couponId, { from: accounts[1] });
        assert(couponRelationIds0.length == 0);
        assert(couponRelationIds1.length == 1 && couponRelationIds1[0].toString() == '0');
    });

    /**
     * @covers CouponRelationStorage.updateUserAddress
     */
    it("should be able to update user address by auth address", async () => {
        const userAddress = accounts[3];
        await truffleAssert.fails(
            _couponRelationStorage.updateUserAddress(0, userAddress, { from: _deployer }),
            truffleAssert.ErrorType.REVERT,
            "Access denied.",
            "No authed address can't execute updateUserAddress()"
        );
        await truffleAssert.passes(
            _couponRelationStorage.updateUserAddress(0, userAddress, { from: accounts[1] }),
            "Authed address can execute updateUserAddress()"
        );

        const relation = await _couponRelationStorage.get(0, { from: accounts[1] });
        assert(relation.userAddress == userAddress);

        const
            userRelationIds2 = await _couponRelationStorage.getRelationIdsByUser(accounts[2], { from: accounts[1] }),
            userRelationIds3 = await _couponRelationStorage.getRelationIdsByUser(accounts[3], { from: accounts[1] });
        assert(userRelationIds2.length == 0);
        assert(userRelationIds3.length == 1 && userRelationIds3[0].toString() == '0');
    });

    /**
     * @covers CouponRelationStorage.updateIsUsed
     */
    it("should be able to update use status by auth address", async () => {
        const isUsed = true;
        await truffleAssert.fails(
            _couponRelationStorage.updateIsUsed(0, isUsed, { from: _deployer }),
            truffleAssert.ErrorType.REVERT,
            "Access denied.",
            "Not auted address can't execute updateIsUsed()"
        );
        await truffleAssert.passes(
            _couponRelationStorage.updateIsUsed(0, isUsed, { from: accounts[1] }),
            "Authed address can execute updateIsUsed()"
        );

        const relation = await _couponRelationStorage.get(0, { from: accounts[1] });
        assert(!!relation.isUsed);
    });

    /**
     * @covers CouponRelationStorage.all
     */
    it("should be able to get all relations by auth address", async () => {
        await truffleAssert.fails(
            _couponRelationStorage.all({ from: _deployer }),
            truffleAssert.ErrorType.REVERT,
            "Access denied.",
            "Not authed address can't execute all()"
        );
        await truffleAssert.passes(
            _couponRelationStorage.all({ from: accounts[1] }),
            "Authed address can execute all()"
        );

        await _couponRelationStorage.create(1, accounts[3], { from: accounts[1] });
        let relations = await _couponRelationStorage.all({ from: accounts[1] });
        assert(relations.length == 2);
        assert(
            relations[0].couponId == 0 &&
            relations[0].userAddress == accounts[2] &&
            !relations[0].isUsed
        );
        assert(
            relations[1].couponId == 1 &&
            relations[1].userAddress == accounts[3] &&
            !relations[1].isUsed
        );

        await _couponRelationStorage.deletee(0, { from: accounts[1] });
        await _couponRelationStorage.updateIsUsed(1, true, { from: accounts[1] });
        relations = await _couponRelationStorage.all({ from: accounts[1] });
        assert(relations.length == 2);
        assert(
            relations[0].couponId == 0 &&
            relations[0].userAddress == '0x' + '0'.repeat(40) &&
            !relations[0].isUsed
        );
        assert(
            relations[1].couponId == 1 &&
            relations[1].userAddress == accounts[3] &&
            !!relations[1].isUsed
        );
    });
});
