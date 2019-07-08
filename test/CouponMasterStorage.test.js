const
    CouponMasterStorage = artifacts.require('CouponMasterStorage'),
    assert = require('chai').assert,
    truffleAssert = require('truffle-assertions');

contract('CouponMasterStorage', accounts => {
    let _couponMasterStorage;
    const _deployer = accounts[0];

    // set up
    beforeEach(async () => {
        _couponMasterStorage = await CouponMasterStorage.new({ from: _deployer });
        await _couponMasterStorage.create(accounts[2], 10, 10, '', { from: _deployer });
        await _couponMasterStorage.auth(accounts[1], { from: _deployer });
    });

    // tear down
    afterEach(async () => { });

    /**
     * @covers CouponMasterStorage.auth
     */
    it("should be able to change auth address by deployer", async () => {
        await truffleAssert.passes(
            _couponMasterStorage.auth(accounts[2], { from: _deployer }),
            "Deployer can execute auth()"
        );
        assert(await _couponMasterStorage.getAuthAddr() == accounts[2], 'Change authAddr');
        await truffleAssert.fails(
            _couponMasterStorage.auth(accounts[1], { from: accounts[1] }),
            truffleAssert.ErrorType.REVERT,
            "Access denied.",
            "Others can't execute auth()"
        );
    });

    /**
     * @covers CouponMasterStorage.create
     */
    it("should be able to create master by auth address", async () => {
        const
            creatorAddress = accounts[2],
            price = 10,
            remainingNumber = 100,
            additional = JSON.stringify({ msg: "It's test." });

        await truffleAssert.fails(
            _couponMasterStorage.create(creatorAddress, price, remainingNumber, additional, { from: _deployer }),
            truffleAssert.ErrorType.REVERT,
            "Access denied.",
            "Not authed address can't execute create()"
        );
        await truffleAssert.passes(
            _couponMasterStorage.create(creatorAddress, price, remainingNumber, additional, { from: accounts[1] }),
            'Authed address can execute create()'
        )

        const master = await _couponMasterStorage.get(1, { from: accounts[1] });
        assert(
            master.creatorAddress == creatorAddress &&
            master.price == price &&
            master.remainingNumber == remainingNumber &&
            master.additional == additional
        );

        const masterIds = await _couponMasterStorage.getMasterIdsByUser(creatorAddress, { from: accounts[1] });
        assert(masterIds.length == 2 && masterIds[1].toString() == "1");
    });

    /**
     * @covers CouponMasterStorage.get
     */
    it("should be able to get master by auth address", async () => {
        await truffleAssert.fails(
            _couponMasterStorage.get(0, { from: _deployer }),
            truffleAssert.ErrorType.REVERT,
            "Access denied.",
            "Not authed address can't execute get()"
        );
        await truffleAssert.passes(
            _couponMasterStorage.get(0, { from: accounts[1] }),
            "Authed address can execute get()"
        );
    });

    /**
     * @covers CouponMasterStorage.update
     */
    it("should be able to update master by auth address", async () => {
        const
            creatorAddress = accounts[3],
            price = 50,
            remainingNumber = 30,
            additional = JSON.stringify({ hoge: "HOGE" });
        await truffleAssert.fails(
            _couponMasterStorage.update(0, creatorAddress, price, remainingNumber, additional, { from: _deployer }),
            truffleAssert.ErrorType.REVERT,
            "Access denied.",
            "Not authed address can't execute update()"
        );
        await truffleAssert.passes(
            _couponMasterStorage.update(0, creatorAddress, price, remainingNumber, additional, { from: accounts[1] }),
            "Authed address can execute update()"
        );

        const master = await _couponMasterStorage.get(0, { from: accounts[1] });
        assert(
            master.creatorAddress == creatorAddress &&
            master.price == price &&
            master.remainingNumber == remainingNumber &&
            master.additional == additional
        );

        const
            masterIds2 = await _couponMasterStorage.getMasterIdsByUser(accounts[2], { from: accounts[1] }),
            masterIds3 = await _couponMasterStorage.getMasterIdsByUser(accounts[3], { from: accounts[1] });

        assert(masterIds2.length == 0);
        assert(masterIds3.length == 1 && masterIds3[0].toString() == "0");
    });

    /**
     * @covers CouponMasterStorage.deletee
     */
    it("sould be able to delete master by auth address", async () => {
        await truffleAssert.fails(
            _couponMasterStorage.deletee(0, { from: _deployer }),
            truffleAssert.ErrorType.REVERT,
            "Access denied.",
            "Not authed address can't execute deletee()"
        );
        await truffleAssert.passes(
            _couponMasterStorage.deletee(0, { from: accounts[1] }),
            "Authed address can execute deletee()"
        );

        const master = await _couponMasterStorage.get(0, { from: accounts[1] });
        assert(
            master.creatorAddress == "0x" + "0".repeat(40) &&
            master.price == 0 &&
            master.remainingNumber == 0 &&
            master.additional == ''
        );

        const masterIds = await _couponMasterStorage.getMasterIdsByUser(accounts[2], { from: accounts[1] });
        assert(masterIds.length == 0);
    });


    /**
     * @covers CouponMasterStorage.getMasterIdsByUser
     */
    it("should be able to get the master IDs by the user issued by authed address", async () => {
        await truffleAssert.fails(
            _couponMasterStorage.getMasterIdsByUser(accounts[2], { from: _deployer }),
            truffleAssert.ErrorType.REVERT,
            "Access denied.",
            "Not authed address can't execute getMasterIdsByUser()"
        );
        await truffleAssert.passes(
            _couponMasterStorage.getMasterIdsByUser(accounts[2], { from: accounts[1] }),
            "Authed address can execute getMasterIdsByUser()"
        );

        const
            masterIds0 = await _couponMasterStorage.getMasterIdsByUser(accounts[0], { from: accounts[1] }),
            masterIds2 = await _couponMasterStorage.getMasterIdsByUser(accounts[2], { from: accounts[1] });

        assert(masterIds0.length == 0);
        assert(masterIds2.length == 1 && masterIds2[0].toString() == "0");
    });

    /**
     * @covers CouponMasterStorage.updateCreaotrAddress
     */
    it("should be able to update creator address by auth address", async () => {
        const creatorAddress = accounts[3];
        await truffleAssert.fails(
            _couponMasterStorage.updateCreatorAddress(0, creatorAddress, { from: _deployer }),
            truffleAssert.ErrorType.REVERT,
            "Access denied.",
            "Not authed address can't execute updateCreatorAddress()"
        );
        await truffleAssert.passes(
            _couponMasterStorage.updateCreatorAddress(0, creatorAddress, { from: accounts[1] }),
            "Authed address can execute updateCreatorAddress()"
        );

        const master = await _couponMasterStorage.get(0, { from: accounts[1] });
        assert(master.creatorAddress == creatorAddress);

        const
            masterIds2 = await _couponMasterStorage.getMasterIdsByUser(accounts[2], { from: accounts[1] }),
            masterIds3 = await _couponMasterStorage.getMasterIdsByUser(accounts[3], { from: accounts[1] });

        assert(masterIds2.length == 0);
        assert(masterIds3.length == 1 && masterIds3[0].toString() == "0");
    });

    /**
     * @covers CouponMasterStorage.updatePrice
     */
    it("should be able to update price by auth address", async () => {
        const price = 50;
        await truffleAssert.fails(
            _couponMasterStorage.updatePrice(0, price, { from: _deployer }),
            truffleAssert.ErrorType.REVERT,
            "Access denied.",
            "Not authed address can't execute updatePrice()"
        );
        await truffleAssert.passes(
            _couponMasterStorage.updatePrice(0, price, { from: accounts[1] }),
            "Authed address can execute updatePrice()"
        );

        const master = await _couponMasterStorage.get(0, { from: accounts[1] });
        assert(master.price == price);
    });

    /**
     * @covers CouponMasterStorage.updateRemainingNumber
     */
    it("should be able to update remaining number by auth address", async () => {
        const remainingNumber = 50;
        await truffleAssert.fails(
            _couponMasterStorage.updateRemainingNumber(0, remainingNumber, { from: _deployer }),
            truffleAssert.ErrorType.REVERT,
            "Access denied.",
            "Not authed address can't execute updateRemainingNumber()"
        );
        await truffleAssert.passes(
            _couponMasterStorage.updateRemainingNumber(0, remainingNumber, { from: accounts[1] }),
            "Authed address can execute updateRemainingNumber()"
        );

        let master = await _couponMasterStorage.get(0, { from: accounts[1] });
        assert(master.remainingNumber == remainingNumber);

        await _couponMasterStorage.updateRemainingNumber(0, -30, { from: accounts[1] });
        master = await _couponMasterStorage.get(0, { from: accounts[1] });
        assert(master.remainingNumber == remainingNumber - 30);
    });

    /**
     * @covers CouponMasterStorage.updateAdditional
     */
    it("should be able to update additional by auth address", async () => {
        const additional = JSON.stringify({ foo: "bar" });
        await truffleAssert.fails(
            _couponMasterStorage.updateAdditional(0, additional, { from: _deployer }),
            truffleAssert.ErrorType.REVERT,
            "Access denied.",
            "Not authed address can't execute updateAdditional()"
        );
        await truffleAssert.passes(
            _couponMasterStorage.updateAdditional(0, additional, { from: accounts[1] }),
            "Authed address can execute updateAdditional()"
        );

        const master = await _couponMasterStorage.get(0, { from: accounts[1] });
        assert(master.additional == additional);
    });

    /**
     * @covers CouponMasterStorage.all
     */
    it("should be able to get all masters by auth address", async () => {
        await truffleAssert.fails(
            _couponMasterStorage.all({ from: _deployer }),
            truffleAssert.ErrorType.REVERT,
            "Access denied.",
            "Not authed address can't execute all()"
        );
        await truffleAssert.passes(
            _couponMasterStorage.all({ from: accounts[1] }),
            "Authed address can execute all()"
        );

        await _couponMasterStorage.create(accounts[3], 20, 20, JSON.stringify({ foo: "bar" }), { from: accounts[1] });
        let masters = await _couponMasterStorage.all({ from: accounts[1] });
        assert(masters.length == 2);
        assert(
            masters[0].creatorAddress == accounts[2] &&
            masters[0].price == 10 &&
            masters[0].remainingNumber == 10 &&
            masters[0].additional == ''
        );
        assert(
            masters[1].creatorAddress == accounts[3] &&
            masters[1].price == 20 &&
            masters[1].remainingNumber == 20 &&
            masters[1].additional == JSON.stringify({ foo: "bar" })
        );

        await _couponMasterStorage.deletee(0, { from: accounts[1] });
        masters = await _couponMasterStorage.all({ from: accounts[1] });
        assert(masters.length == 2);
        assert(
            masters[0].creatorAddress == "0x" + "0".repeat(40) &&
            masters[0].price == 0 &&
            masters[0].remainingNumber == 0 &&
            masters[0].additional == ''
        );
        assert(
            masters[1].creatorAddress == accounts[3] &&
            masters[1].price == 20 &&
            masters[1].remainingNumber == 20 &&
            masters[1].additional == JSON.stringify({ foo: "bar" })
        );
    });
});
