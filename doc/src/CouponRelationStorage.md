# コントラクト CouponRelationStorage
クーポンの所有情報(クーポン⇔ユーザーのリレーション)を保持するストレージの管理用コントラクト。
直接アクセスされることは考えておらず、実行許可の与えられたアドレスからのみアクセスが可能。
RDBにおけるトランザクションテーブルと考えてもらえれば。

## サマリ
### フィールド
| 型         | フィールド名                                 | 概要                                           |
| :--------- | :------------------------------------------- | :--------------------------------------------- |
| struct     | [Relation](#relation)                        | リレーションの定義(レコード)                   |
| Relation[] | [relations](#relations)                      | リレーションのリスト(テーブル)                 |
| mapping    | [_mapUserToRelation](#mapusertorelation)     | ユーザー→リレーションのインデックス           |
| mapping    | [_mapCouponToRelation](#mapcoupontorelation) | クーポン→リレーションのインデックス           |
| address    | [_deployer](#deployer)                       | 本コントラクトをデプロイしたユーザーのアドレス |
| address    | [_authAddr](#authaddr)                       | 実行許可アドレス                               |

### [コンストラクタ](#constructor)
| 修飾子 | 概要                                 |
| :----- | :----------------------------------- |
| public | デプロイしたユーザーの情報を保存する |

### メソッド
| 修飾子      | メソッド名                                        | 概要                                     |
| :---------- | :------------------------------------------------ | :--------------------------------------- |
| public      | [auth](#auth)                                     | 実行許可アドレスを変更する               |
| public view | [getDeployer](#getdeployer)                       | デプロイしたアドレスを取得する           |
| public view | [getAuthAddr](#getauthaddr)                       | アクセス許可アドレスを取得する           |
| public      | [create](#create)                                 | リレーションの作成                       |
| public view | [get](#get)                                       | リレーションの取得                       |
| public      | [update](#update)                                 | リレーションの更新                       |
| public      | [deletee](#deletee)                               | リレーションの削除                       |
| public view | [getRelationIdsByUser](#getrelationidsbyuser)     | ユーザーに紐付いたリレーションのIDを取得 |
| public view | [getRelationIdsByCoupon](#getrelationidsbycoupon) | ユーザーに紐付いたリレーションのIDを取得 |
| public      | [updateCouponId](#updatecouponid)                 | クーポンIDを更新する                     |
| public      | [updateUserAddress](#updateuseraddress)           | ユーザーアドレスを更新する               |
| public      | [updateIsUsed](#updateisused)                     | 使用済みフラグを更新する                 |
| public view | [all](#all)                                       | 全件取得                                 |

## 詳細
### フィールド
#### Relation
ユーザー⇔クーポンリレーションの1レコード分の定義
```sol
struct Relation {
    uint            couponId;
    address payable userAddress;
    bool            isUsed;
}
```
* couponId - クーポン(マスタ)ID
* userAddress - クーポンを所有しているユーザーのアドレス
* isUsed - 使用済みフラグ

#### _relations
リレーションのリスト。RDBにおけるテーブルにあたるもの。
```sol
Relation[] private _relations
```

#### _mapUsertoRelation
ユーザー→リレーションを保持する。
[_relations](#relations)へのインデックス(索引)として使用する。
```sol
mapping(address => uint[]) private _mapUserToRelation
```

#### _mapCouponToRelation
クーポン→リレーションを保持する。
[_relations](#relations)へのインデックス(索引)として使用する。
```sol
mapping(uint => uint[]) private _mapCouponToRelation
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
[_deployer](#deployer)フィールド及び[_authAddr](#authaddr)に呼び出し元アドレス(msg.sender)を格納する。  
※ここでの呼び出し元アドレスはデプロイしたユーザーのアドレスとなる。
##### 定義
```sol
constructor() public
```

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
リレーションを作成する。
inUsedパラメータ(使用済みフラグ)はfalse(未使用)で登録する。
_mapUserToRelation 及び _mapCouponToRelation も併せて登録する。
##### 定義
```sol
create(uint couponId, address payable userAddress) public returns(uint)
```
##### パラメータ
* couponID - クーポンID
* userAddress - ユーザーアドレス
##### 戻り値
1. リレーションID
##### 例外
* 実行許可アドレス以外からのアクセスがあった場合

#### get()
リレーションを取得する。
##### 定義
```sol
get(uint id) public view returns(Relation memory) 
```
##### パラメータ
* id - リレーションID
##### 戻り値
1. リレーション
##### 例外
* 実行許可アドレス以外からのアクセスがあった場合

#### update()
リレーションを更新する
##### 定義
```sol
update(uint id, uint couponId, address payable userAddress, bool isUsed) public
```
##### パラメータ
* id - リレーションID
* couponId - クーポンID
* userAddress - ユーザーアドレス
* isUsed - 使用済みフラグ
##### 戻り値
なし
##### 例外
* 実行許可アドレス以外からのアクセスがあった場合

#### deletee()
リレーションを削除する。
_mapUserToRelation 及び _mapCouponToRelation からも併せて削除する。
##### 定義
```sol
deletee(uint id) public
```
##### パラメータ
* id - リレーションID
##### 戻り値
なし
##### 例外
* 実行許可アドレス以外からのアクセスがあった場合

#### getRelationIdsByUser()
ユーザーに紐付いたリレーションのIDを返す。
##### 定義
```sol
getRelationIdsByUser(address userAddress) public view returns(uint[])
```
##### パラメータ
* userAddress - ユーザーアドレス
##### 戻り値
1. 引数で指定したアドレスを含むリレーションのID
##### 例外
* 実行許可アドレス以外からのアクセスがあった場合

#### getRelationIdsByCoupon()
クーポンに紐付いたリレーションのIDを返す。
##### 定義
```sol
getRelationIdsByCoupon(uint couponId) public view returns(uint[])
```
##### パラメータ
* couponId - クーポンID
##### 戻り値
1. 引数で指定したクーポンIDを含むリレーションのID
##### 例外
* 実行許可アドレス以外からのアクセスがあった場合


#### updateCouponId()
クーポンIDを更新する。
##### 定義
```sol
updateCouponId(uint id, uint couponId) public
```
##### パラメータ
* id - リレーションID
* couponId - クーポンID
##### 戻り値
なし
##### 例外
* 実行許可アドレス以外からのアクセスがあった場合

#### updateUserAddress()
ユーザーアドレスを更新する。
##### 定義
```sol
updateUserAddress(uint id, address userAddress) public
```
##### パラメータ
* id - リレーションID
* userAddress - ユーザーアドレス
##### 戻り値
なし
##### 例外
* 実行許可アドレス以外からのアクセスがあった場合

#### updateIsUsed()
使用済みフラグを更新する。
##### 定義
```sol
updateIsUsed(uint id, bool isUsed) public
```
##### パラメータ
* id - リレーションID
* isUsed - 使用済みフラグ
##### 戻り値
なし
##### 例外
* 実行許可アドレス以外からのアクセスがあった場合

#### all()
リレーションを全て取得する。
##### 定義
```sol
all() public view returns(Relation[] memory)
```
##### パラメータ
なし
##### 戻り値
1. リレーションリスト
##### 例外
* 実行許可アドレス以外からのアクセスがあった場合
