pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

contract CouponMasterStorage {
    struct Master {
        address payable creatorAddress;  // 作成者アドレス
        uint            price;           // 価格(交換レート)
        uint16          remainingNumber; // 配布残枚数
        string          additional;      // 追加情報(JSON文字列、将来のために用意)
    }

    Master[] private _masters;
    mapping(address => uint[]) private _mapUserToMaster;
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
     * クーポンマスタのレコードを作成する。
     */
    function create(
        address payable creatorAddress,
        uint            price,
        uint16          remainingNumber,
        string memory   additional
    ) public returns(uint) {
        require(msg.sender == _authAddr, 'Access denied.');
        uint couponId = _masters.push(
            Master(
                creatorAddress,
                price,
                remainingNumber,
                additional
            )
        ) - 1;

        _mapUserToMaster[creatorAddress].push(couponId);

        return couponId;
    }

    /**
     * クーポンマスタのレコードを取得する。
     */
    function get(uint id) public view returns(Master memory) {
        require(msg.sender == _authAddr, 'Access denied.');
        return _masters[id];
    }

    /**
     * クーポンマスタのレコードを更新する。
     */
    function update(
        uint            id,
        address payable creatorAddress,
        uint            price,
        uint16          remainingNumber,
        string memory   additional
    ) public {
        require(msg.sender == _authAddr, 'Access denied.');

        if (_masters[id].creatorAddress != creatorAddress) {
            // ユーザーマップ付け替え
            address oldCreatorAddress = _masters[id].creatorAddress;
            uint len = _mapUserToMaster[oldCreatorAddress].length;
            uint[] memory tmp = new uint[](len - 1);
            uint idx = 0;

            for (uint i = 0; i < len; i++) {
                if (_mapUserToMaster[oldCreatorAddress][i] == id) {
                    continue;
                }

                tmp[idx] = _mapUserToMaster[oldCreatorAddress][i];
                idx++;
            }

            _mapUserToMaster[oldCreatorAddress] = tmp;
            _mapUserToMaster[creatorAddress].push(id);

            _masters[id].creatorAddress = creatorAddress;
        }

        _masters[id].price = price;
        _masters[id].remainingNumber = remainingNumber;
        _masters[id].additional = additional;
    }

    /**
     * クーポンマスタを削除する。
     */
    function deletee(uint id) public {
        require(msg.sender == _authAddr, 'Access denied.');
        address creatorAddress = _masters[id].creatorAddress;

        if (creatorAddress != address(0)) {
            // ユーザーマップ削除
            uint len = _mapUserToMaster[creatorAddress].length;
            uint[] memory tmp = new uint[](len - 1);
            uint idx = 0;

            for (uint i = 0; i < len; i++) {
                if (_mapUserToMaster[creatorAddress][i] == id) {
                    continue;
                }

                tmp[idx] = _mapUserToMaster[creatorAddress][i];
                idx++;
            }

            _mapUserToMaster[creatorAddress] = tmp;
        }

        delete _masters[id];
    }

    /**
     * ユーザーアドレスに紐付いたマスターIDを返す。
     */
    function getMasterIdsByUser(address creatorAddress) public view returns(uint[] memory) {
        require(msg.sender == _authAddr, 'Access denied.');
        return _mapUserToMaster[creatorAddress];
    }

    /**
     * 発行者アドレスを更新する。
     */
    function updateCreatorAddress(uint id, address payable creatorAddress) public {
        require(msg.sender == _authAddr, 'Access denied.');

        if (_masters[id].creatorAddress == creatorAddress) {
            return;
        }

        // ユーザーマップ付け替え
        address oldCreatorAddress = _masters[id].creatorAddress;
        uint len = _mapUserToMaster[oldCreatorAddress].length;
        uint[] memory tmp = new uint[](len - 1);
        uint idx = 0;

        for (uint i = 0; i < len; i++) {
            if (_mapUserToMaster[oldCreatorAddress][i] == id) {
                continue;
            }

            tmp[idx] = _mapUserToMaster[oldCreatorAddress][i];
            idx++;
        }

        _mapUserToMaster[oldCreatorAddress] = tmp;
        _mapUserToMaster[creatorAddress].push(id);

        _masters[id].creatorAddress = creatorAddress;
    }

    /**
     * 価格(交換レート)を更新する。
     */
    function updatePrice(uint id, uint price) public {
        require(msg.sender == _authAddr, 'Access denied.');
        _masters[id].price = price;
    }

    /**
     * 配布残枚数を更新する。
     */
    function updateRemainingNumber(uint id, int32 remainingNumber) public {
        require(msg.sender == _authAddr, 'Access denied.');

        if (remainingNumber < 0) {
            _masters[id].remainingNumber -= uint16(remainingNumber * -1);
        } else {
            _masters[id].remainingNumber = uint16(remainingNumber);
        }
    }

    /**
     * 追加情報を更新する。
     */
    function updateAdditional(uint id, string memory additional) public {
        require(msg.sender == _authAddr, 'Access denied.');
        _masters[id].additional = additional;
    }

    /**
     * クーポンマスタを全て取得する。
     */
    function all() public view returns(Master[] memory) {
        require(msg.sender == _authAddr, 'Access denied.');
        return _masters;
    }
}
