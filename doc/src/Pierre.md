# コントラクト Pierre
クーポンシステムのロジックを実装したコントラクト。
外部からのアクセスは本コントラクトで受けるようにし、別で実装したデータ用コントラクトにアクセスする。
クーポンの交換で支払われたトークンは本コントラクトでプールする。

## サマリ
### フィールド
| 型                    | フィールド名           | 概要                                                                                      |
| :-------------------- | :--------------------- | :---------------------------------------------------------------------------------------- |
| CouponMsterStorage    | [_master](#master)     | [CouponMasterStorage](./CouponMasterStorage.html)コントラクトのインスタンスを保持する     |
| CouponRelationStorage | [_relation](#relation) | [CouponRelationStorage](./CouponRelationStorage.html)コントラクトのインスタンスを保持する |


### [コンストラクタ](#constructor)
| 修飾子 | 概要                                                                        |
| :----- | :-------------------------------------------------------------------------- |
| public | [_master](#master)フィールドと[_relation](#relation)フィールドを初期化する。|


### メソッド
| 修飾子         | メソッド名                                | 概要                                   |
| :------------- | :---------------------------------------- | :------------------------------------- |
| public         | [createCoupon](#createcoupon)             | クーポンを発行する                     |
| public view    | [getCoupon](#getcoupon)                   | クーポンの情報を取得する               |
| public         | [disableCoupon](#disablecoupon)           | クーポンの配布を停止する               |
| public         | [deleteCoupon](#deletecoupon)             | クーポンを削除する                     |
| public payable | [exchangeCoupon](#exchangecoupon)         | クーポンを交換する                     |
| public         | [useCoupon](#usecoupon)                   | クーポンを使用する                     |
| public view    | [getIssuedCouponIds](#getissuedcouponIds) | 発行したクーポンのID一覧を取得する     |
| public view    | [getOwnCouponIds](#getowncouponids)       | 所有しているクーポンのID一覧を取得する |


## 詳細
### フィールド
#### _master
[CouponMasterStorage](./CouponMasterStorage.html)コントラクトのインスタンスを保持する。  
クーポンのマスタデータに関する操作はこのインスタンス経由で実行する。
```sol
CouponMasterStorage public _master
```

#### _relation
[CouponRelationStorage](./CouponRelationStorage.html)コントラクトのインスタンスを保持する。  
クーポンのリレーションデータに関する操作はこのインスタンス経由で実行する。
```sol
CouponRelationStorage public _relation
```

### コンストラクタ
#### constructor()
引数で渡されたアドレスをもとにインスタンスを作成し、それぞれ[_master](#master)フィールド、[_relation](#relation)フィールドに格納する。
##### 定義
```sol
constructor(address masterAddress, address relationAddress) public
```
##### パラメータ
* masterAddress - [CouponMasterStorage](./CouponMasterStorage.html)コントラクトのアドレス
* relationAddress - [CouponRelationStorage](./CouponRelationStorage.html)コントラクトのアドレス


### メソッド
#### createCoupon() 
[CouponMasterStorage.create()](./CouponMasterStorage.html#create)を実行し、
クーポンマスタにクーポンを登録する。
##### 定義
```sol
createCoupon(
    uint price, 
    uint remainingNumber, 
    string memory additional
) public returns(uint)
```
##### パラメータ
* price - クーポンの交換レート
* remainingNumber - 配布枚数
* additional - クーポン追加情報
##### 戻り値
1. クーポンID
##### 例外
* 交換レートが0の場合
* 配布枚数が0の場合


#### getCoupon()
[CouponMasterStorage.get()](./CouponMasterStorage.html#get)を実行し、
指定されたクーポンIDをもつクーポンをマスタから取得し返却する。
##### 定義
```sol
getCoupon(uint couponId) public view returns(uint, address, uint, uint, string memory)
```
##### パラメータ
* couponId - クーポンID
##### 戻り値
1. クーポンID
1. 作成者アドレス
1. 交換レート
1. 配布残枚数
1. クーポン追加情報
##### 例外
* クーポンがマスターに存在しない場合


#### disableCoupon()
[CouponMasterStorage.updateRemainingNumber()](./CouponMasterStorage.html#updateremainingnumber)を実行し、
指定したクーポンIDのクーポンの配布残枚数を0に更新する。
##### 定義
```sol
disableCoupon(uint couponId) public
```
##### パラメータ
* couponId - クーポンID
##### 戻り値
なし
##### 例外
* クーポンがマスターに存在しない場合


#### deleteCoupon()
[CouponRelationStorage.getRelationsByCoupon()](./CouponRelationStorage.html#getrelationsbycoupon)を使用してクーポンを所有しているユーザーを特定、
未使用の場合に限り所有者にトークンを払い戻す。  
(払い戻すトークン数は[CouponMasterStorage.get()](./CouponMasterStorage.html#get)を用いて取得する。)  
[CouponRelationStorage.deletee()](./CouponRelationStorage.html#deletee)を実行してリレーションを削除後、
[CouponMasterStorage.deletee()](./CouponMasterStorage.html#deletee)を実行し、クーポンを削除する。
##### 定義
```sol
deleteCoupon(uint id) public
```
##### パラメータ
* couponId - クーポンID
##### 戻り値
なし
##### 例外
なし(マスターに存在しない場合でも例外は発生させない)


#### exchangeCoupon()
送金されたトークン(msg.value)が[CouponMasterStorage.get()](./CouponMasterStorage.html#get)で取得したマスターの交換レート(price)と等しくない場合、処理を終了する。  
過不足ない場合、[CouponRelationStorage.create()](./CouponRelationStorage.html#create)を呼出してリレーションを作成、
[CouponMasterStorage.updateRemainingNumber](./CouponMasterStorage.html#updateremainingnumber)で配布残枚数を減算する。
##### 定義
```sol
exchangeCoupon(uint couponId) public payable returns(uint)
```
##### パラメータ
* couponId - クーポンID
##### 戻り値
1. リレーションID
##### 例外
* クーポンがマスターに存在しない場合
* 支払いトークンが交換レートと異なっている場合


#### useCoupon()
[CouponRelationStorage.get()](./CouponRelationStorage.html#get)でリレーションを取得する。  
リレーションが存在しない場合や実行者(msg.sender)が所有者(userAddress)でない場合、既に使用済みの場合は処理を終了する。  
[CouponMasterStorage.get()](./CouponMasterStorage.html#get)でマスターを取得し、発行者のアドレスを取得する(マスター自体が存在しない場合は処理終了)。  
トークンを送金(_&lt;発行者のアドレス&gt;_.transfer())後、[CouponRelationStorage.updateIsUsed()](./CouponRelationStorage.html#updateisused)でクーポンを使用済みにする。
##### 定義
```sol
useCoupon(uint couponId) public
```
##### パラメータ
* couponId - クーポンID
##### 戻り値
なし
##### 例外
* リレーションが存在しない場合
* 実行者がクーポンの所有者でない場合
* 既に使用済みの場合
* クーポンがマスターに存在しない場合
* 発行者への支払いトークンが不足している場合


#### getIssuedCouponIds()
実行者(msg.sender)に紐づくマスターのIDを取得([CouponMasterStorage.getMasterIdsByUser()](./CouponMasterStorage.html#getmasteridsbyuser))し、返却する。
##### 定義
```sol
getIssuedCouponIds(uint filter) public view returns(uint[] memory)
```
##### パラメータ
* filter - 取得するクーポンIDのフィルター
  + 0 - 全て(デフォルト)
  + 1 - 配布残あり
  + 2 - 配布残なし
##### 戻り値
1. クーポンID一覧
##### 例外
なし


#### getOwnCouponIds()
実行者(msg.sender)に紐づくリレーションを取得([CouponRelationStorage.getRelationsByUser()](./CouponRelationStorage.html#getrelationsbyuser))し、
クーポンIDを配列で返す。
##### 定義
```sol
getOwnCouponIds(uint filter) public view returns(uint[] memory)
```
##### パラメータ
* filter - 取得するクーポンIDのフィルター
  + 0 - 全て(デフォルト)
  + 1 - 未使用
  + 2 - 使用済み
##### 戻り値
1. クーポンID一覧
##### 例外
なし
