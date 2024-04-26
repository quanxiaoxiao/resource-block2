## 文件服务器

### 上传文件

```shell
$ curl --data-binary @package.json 'http://127.0.0.1:3091/upload?name=package.json'
```

- `name`: 设置文件名, 可以不设置

上传成功后会返回数据


```json
{
    "_id": "656d8a2413e7b6b3911bf0bb",
    "name": "package.json",
    "description": "",
    "timeCreate": 1701677604983,
    "timeUpdate": 1701677604999,
    "mime": null,
    "size": 1239,
    "entry": "641feb1f3a9abe2e5bca7583",
    "hash": "e3d4fdba86e5ae9e8b93d6f128bd41b21b360e4789d5b57b0bbb4bad75ebb5f9",
    "category": null
}
```

根据返回的_id `656d8a2413e7b6b3911bf0bb` 可以对文件进行以下接口操作

### 修改文件名

```shell
$ curl -X PUT --data-raw '{"name":"test.json"}' 'http://127.0.0.1:3091/api/resource/656d8a2413e7b6b3911bf0bb'
{
    "_id": "656d8a2413e7b6b3911bf0bb",
    "name": "test.json",
    "description": "",
    "timeCreate": 1701677604983,
    "timeUpdate": 1701677604999,
    "mime": null,
    "size": 1239,
    "entry": "641feb1f3a9abe2e5bca7583",
    "hash": "e3d4fdba86e5ae9e8b93d6f128bd41b21b360e4789d5b57b0bbb4bad75ebb5f9",
    "category": null
}
```

### 替换文件内容

```shell
$ curl -X PUT --data-binary @package-lock.json 'http://127.0.0.1:3091/resource/656d8a2413e7b6b3911bf0bb'
{
    "_id": "656d8a2413e7b6b3911bf0bb",
    "name": "test.json",
    "description": "",
    "timeCreate": 1701677604983,
    "timeUpdate": 1701678809757,
    "mime": null,
    "size": 234097,
    "entry": "641feb1f3a9abe2e5bca7583",
    "hash": "caa407b14df8fd0fdcd1710bc140ea87b1ef9da1ac5ff595e9748b7b98c40d0e",
    "category": null
}
```

### 下载文件
```shell
$ curl 'http://127.0.0.1:3091/resource/656d8a2413e7b6b3911bf0bb' > test.json
```

### 删除文件

```shell
$ curl -X DELETE 'http://127.0.0.1:3091/api/resource/656d8a2413e7b6b3911bf0bb'
{
    "_id": "656d8a2413e7b6b3911bf0bb",
    "name": "test.json",
    "description": "",
    "timeCreate": 1701677604983,
    "timeUpdate": 1701678809757,
    "mime": null,
    "size": 234097,
    "entry": "641feb1f3a9abe2e5bca7583",
    "hash": "caa407b14df8fd0fdcd1710bc140ea87b1ef9da1ac5ff595e9748b7b98c40d0e",
    "category": null
}
```
