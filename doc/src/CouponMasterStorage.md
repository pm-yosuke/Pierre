# コントラクト CouponMasterStorage
クーポン情報を保持するストレージの管理用コントラクト。
直接アクセスされることは考えておらず、実行許可の与えられたアドレスからのみアクセスが可能。
RDBにおけるマスタテーブルと考えてもらえれば。

## サマリ
### フィールド
| 型       | フィールド名                         | 概要                                           |
| :------- | :----------------------------------- | :--------------------------------------------- |
| struct   | [Master](#master)                    | クーポンマスタの定義(レコード)                 |
| Master[] | [_masters](#masters)                 | クーポンマスタのリスト(テーブル)               |
| mapping  | [_mapUserToMaster](#mapusertomaster) | (発行)ユーザー→マスターのインデックス         |
| address  | [_deployer](#deployer)               | 本コントラクトをデプロイしたユーザーのアドレス |
| address  | [_authAddr](#authaddr)               | 実行許可アドレス                               |

### [コンストラクタ](#constructor)
| 修飾子 | 概要                                 |
| :----- | :----------------------------------- |
| public | デプロイしたユーザーの情報を保存する |

### メソッド
| 修飾子      | メソッド名                                      | 概要                                         |
| :---------- | :---------------------------------------------- | :------------------------------------------- |
| public      | [auth](#auth)                                   | 実行許可アドレスを変更する                   |
| public view | [getDeployer](#getdeployer)                     | デプロイしたアドレスを取得する               |
| public view | [getAuthAddr](#getauthaddr)                     | アクセス許可アドレスを取得する               |
| public      | [create](#create)                               | マスターの作成する                           |
| public view | [get](#get)                                     | マスターの取得する                           |
| public      | [update](#update)                               | マスター(レコード)の更新をする               |
| public      | [deletee](#deletee)                             | マスターの削除をする                         |
| public view | [getMasterIdsByUser](#getmasteridsbyuser)       | ユーザーが発行したクーポンのID一覧を取得する |
| public      | [updateCreatorAddress](#updatecreatoraddress)   | 作成者の更新をする                           |
| public      | [updatePrice](#updateprice)                     | 交換レートの更新をする                       |
| public      | [updateRemainingNumber](#updateremainingnumber) | 配布残枚数の更新をする                       |
| public      | [updateAdditional](#updateadditional)           | 追加情報の更新をする                         |
| public view | [all](#all)                                     | マスターを全件取得する                       |

## 詳細
### フィールド
#### Master
クーポンマスタの1レコード分の定義。
```sol
struct Master {
    address creatorAddress;
    uint    price;
    uint16  remainingNumber;
    string  additional;
}
```
* creatorAddress - 発行者アドレス。クーポンが使用されるとこのアドレス宛にトークンが送信される。
* price - 交換レート。
* remainingNumbe - 配布残枚数
* additional - 追加情報。初版では未使用だが、今後の機能拡張ために用意。JSON文字列を想定。

#### _masters
クーポンマスタのリストを保持。RDBにおけるテーブルにあたるもの。
```sol
Master[] private _masters
```

#### _mapUserToMaster
(クーポン発行)ユーザー→マスターを保持する。
[_masters](#masters)へのインデックス(索引)として使用する。
```sol
mapping(address => uint[]) private _mapUserToMaster
```

#### _deployer
本コントラクトをデプロイしたユーザーのアドレスを格納。
```sol
address private _deployer
```

#### _authAddr
本コントラクトを実行できるユーザーまたはコントラクトのアドレスを格納。
auth()メソッドを除く全てのメソッドはこのアドレスからの呼出ししか受け付けない。
```sol
address private _authAddr
```

### コンストラクタ
#### constructor()
[_deployer](#deployer)フィールド及び[_authAddr](#authaddr)に呼び出し元アドレス (msg.sender) を格納する。  
※ここでの呼び出し元アドレスはデプロイしたユーザーのアドレスとなる。
##### 定義
```sol
constructor() public
```
##### パラメータ
なし


### メソッド
#### auth()
実行許可アドレスを変更する。
このメソッドのみ、デプロイしたユーザーだけが呼出し可能。
##### 定義
```sol
auth(address addr) public
```
##### パラメータ
* addr - メソッドの実行を許可するユーザーまたはコントラクトのアドレス
##### 戻り値
なし
##### 例外
* デプロイユーザー以外からのアクセスがあった場合

#### getDeployer()
本コントラクトをデプロイしたユーザー(アドレス)を取得する。
##### 定義
```sol
getDeployer() public view returns(address)
```
##### パラメータ
なし
##### 戻り値
1. 本コントラクトをデプロイしたアドレス
##### 例外
なし

#### getAuthAddr()
本コントラクトへのアクセスを許可されたアドレスを取得する。
##### 定義
```sol
getAuthAddr() public view returns(addres)
```
##### パラメータ
なし
##### 戻り値
1. 本コントラクトへのアクセスを許可したアドレス
##### 例外
なし


#### create()
クーポンマスタのレコードを作成する。
##### 定義
```sol
create(
    address payable creatorAddress,
    uint            price,
    uint16          remainingNumber,
    string memory   additional
) public returns(uint)
```
##### パラメータ
* creatorAddress - 作成者アドレス
* price - 交換レート
* remainingNumber - 配布数
* additional - 追加情報
##### 戻り値
1. クーポン(マスタ)ID
##### 例外
* 実行許可アドレス以外からのアクセスがあった場合


#### get()
クーポンマスタのレコードを取得する
##### 定義
```sol
get(uint id) public view returns(Master memory) 
```
##### パラメータ
* id - クーポンID
##### 戻り値
1. クーポンマスタ
##### 例外
* 実行許可アドレス以外からのアクセスがあった場合


#### update()
クーポンマスタのレコードを更新する。
1レコードを一括で更新するので、個別に項目を更新したい場合は後述のupdateXXXメソッドを使用すること。
##### 定義
```sol
update(
    uint            id,
    address payable creatorAddress
    uint            price,
    uint16          remainingNumber,
    string memory   additional
) public
```
##### パラメータ
* id - クーポンID
* creatorAddress - 発行者アドレス
* price - 交換レート
* remainingNumber - 配布残枚数
* additional - 追加情報
##### 戻り値
なし
##### 例外
* 実行許可アドレス以外からのアクセスがあった場合


#### deletee()
クーポンマスタを削除する。
##### 定義
```sol
deletee(uint id) public
```
##### パラメータ
* id - クーポンID
##### 戻り値
なし
##### 例外
* 実行許可アドレス以外からのアクセスがあった場合


#### getMasterIdsByUser()
ユーザーが発行したクーポンのIDの一覧を返す。
##### 定義
```sol
getMasterIdsByUser(address creatorAddress) public view return(uint[] memory)
```
##### パラメータ
* creatorAddress - 発行者アドレス
##### 戻り値
* クーポンのID一覧
##### 例外
* 実行許可アドレス以外からのアクセスがあった場合

#### updateCreatorAddress()
発行者アドレスを更新する。
##### 定義
```sol
updateCreatorAddress(uint id, address payable creatorAddress) public
```
##### パラメータ
* id - クーポンID
* creatorAddress - 発行者アドレス
##### 戻り値
なし
##### 例外
* 実行許可アドレス以外からのアクセスがあった場合


#### updatePrice()
交換レートを更新する。
##### 定義
```sol
updatePrice(uint id, uint price) public
```
##### パラメータ
* id - クーポンID
* price - 交換レート
##### 戻り値
なし
##### 例外
* 実行許可アドレス以外からのアクセスがあった場合


#### updateRemainingNumber()
配布残枚数を更新する。
##### 定義
```sol
updateRemainingNumber(uint id, int32 remainingNumber) public
```
##### パラメータ
* id - クーポンID
* remainingNumber - 配布残枚数、マイナス値の場合はその分だけ減算する。
##### 戻り値
なし
##### 例外
* 実行許可アドレス以外からのアクセスがあった場合


#### updateAdditional()
追加情報を更新する。
##### 定義
```sol
updateAdditional(uint id, string memory additional) public
```
##### パラメータ
* id - クーポンID
* additional - 追加情報
##### 戻り値
なし
##### 例外
* 実行許可アドレス以外からのアクセスがあった場合

#### all()
クーポンマスタを全て取得する。
##### 定義
```sol
all() public view returns(Master[] memory)
```
##### パラメータ
なし
##### 戻り値
1. クーポンマスタリスト
##### 例外
* 実行許可アドレス以外からのアクセスがあった場合
