pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import './CouponMasterStorage.sol';
import './CouponRelationStorage.sol';

contract Pierre {
    CouponMasterStorage _master;
    CouponRelationStorage _relation;

    /**
     * コンストラクタ
     */
    constructor(address masterAddress, address relationAddress) public {
        _master = CouponMasterStorage(masterAddress);
        _relation = CouponRelationStorage(relationAddress);
    }

    /**
     * クーポンマスタにクーポンを登録する。
     */
    function createCoupon(uint price, uint16 remainingNumber, string memory additional) public returns(uint) {
        return _master.create(msg.sender, price, remainingNumber, additional);
    }

    /**
     * クーポンを取得する。
     */
    function getCoupon(uint couponId) public view returns(uint, address, uint, uint, string memory) {
        CouponMasterStorage.Master memory master = _master.get(couponId);
        require(
            master.creatorAddress != address(0) ||
            master.price != 0 ||
            master.remainingNumber != 0 ||
            (bytes(master.additional)).length > 0,
            'Not found.'
        );

        return (couponId, master.creatorAddress, master.price, master.remainingNumber, master.additional);
    }

    /**
     * クーポンの配布残枚数を0に更新する。
     */
    function disableCoupon(uint couponId) public {
        CouponMasterStorage.Master memory master = _master.get(couponId);
        require(
            master.creatorAddress != address(0) ||
            master.price != 0 ||
            master.remainingNumber != 0 ||
            (bytes(master.additional)).length > 0,
            'Not found.'
        );
        _master.updateRemainingNumber(couponId, 0);
    }

    /**
     * クーポンを削除する。
     */
    function deleteCoupon(uint couponId) public {
        CouponMasterStorage.Master memory master = _master.get(couponId);
        require(
            master.creatorAddress != address(0) ||
            master.price != 0 ||
            master.remainingNumber != 0 ||
            (bytes(master.additional)).length > 0,
            'Not found.'
        );
        uint[] memory relationIds = _relation.getRelationIdsByCoupon(couponId);

        // 未使用分については払い戻しをしつつ、リレーションを削除
        for (uint i = 0; i < relationIds.length; i++) {
            CouponRelationStorage.Relation memory r = _relation.get(relationIds[i]);

            if (!r.isUsed) {
                require(address(this).balance / (1 ether) >= master.price, 'Internal error.');
                r.userAddress.transfer(master.price * (1 ether));
            }

           _relation.deletee(relationIds[i]);
        }

        _master.deletee(couponId);
    }

    /**
     * クーポンを交換する。
     */
    function exchangeCoupon(uint couponId) public payable returns(uint) {
        CouponMasterStorage.Master memory master = _master.get(couponId);
        require(
            master.creatorAddress != address(0) ||
            master.price != 0 ||
            master.remainingNumber != 0 ||
            (bytes(master.additional)).length > 0,
            'Not found.'
        );
        require(msg.value / (1 ether) == master.price && master.remainingNumber > 0, 'Bad request.');

        _relation.create(couponId, msg.sender);
        _master.updateRemainingNumber(couponId, -1);
    }

    /**
     * クーポンを使用する。
     */
    function useCoupon(uint couponId) public {
        CouponMasterStorage.Master memory master = _master.get(couponId);
        require(
            master.creatorAddress != address(0) ||
            master.price != 0 ||
            master.remainingNumber != 0 ||
            (bytes(master.additional)).length > 0,
            'Not found.'
        );
        require(address(this).balance / (1 ether) >= master.price, 'Internal error.');

        uint[] memory relationIds = _relation.getRelationIdsByUser(msg.sender);
        bool inPossession = false;

        for (uint i = 0; i < relationIds.length; i++) {
            CouponRelationStorage.Relation memory  r = _relation.get(relationIds[i]);

            if (r.couponId == couponId && !r.isUsed) {
                inPossession = true;
                master.creatorAddress.transfer(master.price * (1 ether));
                _relation.updateIsUsed(relationIds[i], true);
                break;
            }
        }

        // クーポンを保有していないか、使用済みのものしかない場合はエラー
        require(inPossession == true, 'Bad request.');
    }

    /**
     * メソッドの実行者が発行したクーポンの一覧を返す。
     */
    function getIssuedCouponIds(uint filter) public view returns(uint[] memory) {
        uint[] memory masterIds = _master.getMasterIdsByUser(msg.sender);

        if (filter != 1 && filter != 2) {
            return masterIds;
        }

        // 配列を固定長にする関係で先に残ありの個数を数える
        uint isLeftNum = 0;

        for (uint i = 0; i < masterIds.length; i++) {
            isLeftNum += ((_master.get(masterIds[i])).remainingNumber > 0) ? 1 : 0;
        }

        uint[] memory isLeftCouponIds = new uint[](isLeftNum);
        uint[] memory isNotLeftCouponIds = new uint[](masterIds.length - isLeftNum);
        uint isLeftIdx = 0;
        uint isNotLeftIdx = 0;

        for (uint i = 0; i < masterIds.length; i++) {
            CouponMasterStorage.Master memory m = _master.get(masterIds[i]);

            if (m.remainingNumber > 0) {
                isLeftCouponIds[isLeftIdx] = masterIds[i];
                isLeftIdx++;
            } else {
                isNotLeftCouponIds[isNotLeftIdx] = masterIds[i];
                isNotLeftIdx++;
            }
        }

        return (filter == 1) ? isLeftCouponIds : isNotLeftCouponIds;
    }

    /**
     * メソッドの実行者が所有しているクーポンの一覧を返す。
     */
    function getOwnCouponIds(uint filter) public view returns(uint[] memory) {
        uint[] memory relationIds = _relation.getRelationIdsByUser(msg.sender);

        // 配列を固定長にする関係で先に使用済みの個数を数える
        uint isUsedNum = 0;

        for (uint i = 0; i < relationIds.length; i++) {
            isUsedNum += ((_relation.get(relationIds[i])).isUsed) ? 1 : 0;
        }

        uint[] memory allCouponIds = new uint[](relationIds.length);
        uint[] memory isUsedCouponIds = new uint[](isUsedNum);
        uint[] memory isNotUsedCouponIds = new uint[](relationIds.length - isUsedNum);
        uint isUsedIdx = 0;
        uint isNotUsedIdx = 0;

        for (uint i = 0; i < relationIds.length; i++) {
            CouponRelationStorage.Relation memory r = _relation.get(relationIds[i]);
            allCouponIds[i] = r.couponId;

            if (r.isUsed) {
                isUsedCouponIds[isUsedIdx] = r.couponId;
                isUsedIdx++;
            } else {
                isNotUsedCouponIds[isNotUsedIdx] = r.couponId;
                isNotUsedIdx++;
            }
        }

        if (filter == 1) {
            return isNotUsedCouponIds;
        } else if (filter == 2) {
            return isUsedCouponIds;
        }

        return allCouponIds;
    }
}