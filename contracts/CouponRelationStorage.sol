pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

contract CouponRelationStorage {
    struct Relation {
        uint            couponId;    // クーポンID
        address payable userAddress; // クーポン所有者アドレス
        bool            isUsed;      // 使用済みフラグ
    }

    Relation[] private _relations;
    mapping(address => uint[]) private _mapUserToRelation;
    mapping(uint => uint[]) private _mapCouponToRelation;
    address private _deployer;
    address private _authAddr;

    /**
     * コンストラクタ
     */
    constructor() public {
        _deployer = msg.sender;
        _authAddr = msg.sender;
    }

    function getDeployer() public view returns(address) {
        return _deployer;
    }

    function getAuthAddr() public view returns(address) {
        return _authAddr;
    }

    /**
     * 実行許可アドレスを変更する。
     */
    function auth(address addr) public {
        require(msg.sender == _deployer, 'Access denied.');
        _authAddr = addr;
    }

    /**
     * リレーションを作成する。
     */
    function create(uint couponId, address payable userAddress) public returns(uint) {
        require(msg.sender == _authAddr, 'Access denied.');
        uint relationId = _relations.push(Relation(couponId, userAddress, false)) - 1;
        _mapUserToRelation[userAddress].push(relationId);
        _mapCouponToRelation[couponId].push(relationId);

        return relationId;
    }

    /**
     * リレーションを取得する。
     */
    function get(uint id) public view returns(Relation memory) {
        require(msg.sender == _authAddr, 'Access denied.');
        return _relations[id];
    }

    /**
     * リレーションを更新する。
     */
    function update(uint id, uint couponId, address payable userAddress, bool isUsed) public {
        require(msg.sender == _authAddr, 'Access denied.');

        uint len;
        uint[] memory tmp;
        uint idx;

        if (_relations[id].couponId != couponId) {
            // ユーザーマップ付け替え
            uint oldCouponId = _relations[id].couponId;
            len = _mapCouponToRelation[oldCouponId].length;
            tmp = new uint[](len - 1);
            idx = 0;

            for (uint i = 0; i < len; i++) {
                if (_mapCouponToRelation[oldCouponId][i] == id) {
                    continue;
                }

                tmp[idx] = _mapCouponToRelation[oldCouponId][i];
                idx++;
            }

            _mapCouponToRelation[oldCouponId] = tmp;
            _mapCouponToRelation[couponId].push(id);

            _relations[id].couponId = couponId;
        }

        if (_relations[id].userAddress != userAddress) {
            // ユーザーマップ付け替え
            address oldUserAddress = _relations[id].userAddress;
            len = _mapUserToRelation[oldUserAddress].length;
            tmp = new uint[](len - 1);
            idx = 0;

            for (uint i = 0; i < len; i++) {
                if (_mapUserToRelation[oldUserAddress][i] == id) {
                    continue;
                }

                tmp[idx] = _mapUserToRelation[oldUserAddress][i];
                idx++;
            }

            _mapUserToRelation[oldUserAddress] = tmp;
            _mapUserToRelation[userAddress].push(id);
            _relations[id].userAddress = userAddress;
        }

        _relations[id].isUsed = isUsed;
    }

    /**
     * リレーションを削除する。
     */
    function deletee(uint id) public {
        require(msg.sender == _authAddr, 'Access denied.');
        // ユーザーマップから削除
        address userAddress = _relations[id].userAddress;
        uint len = _mapUserToRelation[userAddress].length;
        uint[] memory tmp = new uint[](len - 1);
        uint idx = 0;
        bool deleted = false;

        for (uint i = 0; i < len; i++) {
            if (_mapUserToRelation[userAddress][i] == id && !deleted) {
                deleted = true;
                continue;
            }

            tmp[idx] = _mapUserToRelation[userAddress][i];
            idx++;
        }

        _mapUserToRelation[userAddress] = tmp;

        // クーポンマップから削除
        uint couponId = _relations[id].couponId;
        len = _mapCouponToRelation[couponId].length;
        tmp = new uint[](len - 1);
        idx = 0;
        deleted = false;

        for (uint i = 0; i < len; i++) {
            if (_mapCouponToRelation[couponId][i] == id && !deleted) {
                deleted = true;
                continue;
            }

            tmp[idx] = _mapCouponToRelation[couponId][i];
            idx++;
        }

        _mapCouponToRelation[couponId] = tmp;

        // リレーション本体を削除
        delete _relations[id];
    }

    /**
     * ユーザーアドレスに紐付いたリレーションIDを返す。
     */
    function getRelationIdsByUser(address userAddress) public view returns(uint[] memory) {
        require(msg.sender == _authAddr, 'Access denied.');

        return _mapUserToRelation[userAddress];
    }

    /**
     * クーポンIDに紐付いたリレーションIDを返す。
     */
    function getRelationIdsByCoupon(uint couponId) public view returns(uint[] memory) {
        require(msg.sender == _authAddr, 'Access denied.');

        return _mapCouponToRelation[couponId];
    }


    /**
     * クーポンIDを更新する。
     */
    function updateCouponId(uint id, uint couponId) public {
        require(msg.sender == _authAddr, 'Access denied.');

        if (_relations[id].couponId == couponId) {
            return;
        }

        // クーポンマップ付け替え
        uint oldCouponId = _relations[id].couponId;
        uint len = _mapCouponToRelation[oldCouponId].length;
        uint[] memory tmp = new uint[](len - 1);
        uint idx = 0;
        bool deleted = false;

        for (uint i = 0; i < len; i++) {
            if (_mapCouponToRelation[oldCouponId][i] == id && !deleted) {
                deleted = true;
                continue;
            }

            tmp[idx] = _mapCouponToRelation[oldCouponId][i];
            idx++;
        }

        _mapCouponToRelation[oldCouponId] = tmp;
        _mapCouponToRelation[couponId].push(id);

        _relations[id].couponId = couponId;
    }

    /**
     * ユーザーアドレスを更新する。
     */
    function updateUserAddress(uint id, address payable userAddress) public {
        require(msg.sender == _authAddr, 'Access denied.');

        if (_relations[id].userAddress == userAddress) {
            return;
        }

        // ユーザーマップ付け替え
        address oldUserAddress = _relations[id].userAddress;
        uint len = _mapUserToRelation[oldUserAddress].length;
        uint[] memory tmp = new uint[](len - 1);
        uint idx = 0;
        bool deleted = false;

        for (uint i = 0; i < len; i++) {
            if (_mapUserToRelation[oldUserAddress][i] == id && !deleted) {
                deleted = true;
                continue;
            }

            tmp[idx] = _mapUserToRelation[oldUserAddress][i];
            idx++;
        }

        _mapUserToRelation[oldUserAddress] = tmp;
        _mapUserToRelation[userAddress].push(id);

        _relations[id].userAddress = userAddress;
    }

    /**
     * 使用済みフラグを更新する。
     */
    function updateIsUsed(uint id, bool isUsed) public {
        require(msg.sender == _authAddr, 'Access denied.');
        _relations[id].isUsed = isUsed;
    }

    /**
     * リレーションを全て取得する。
     */
    function all() public view returns(Relation[] memory) {
        require(msg.sender == _authAddr, 'Access denied.');
        return _relations;
    }
}