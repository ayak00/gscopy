# GitのStagingファイルをCopy

諸々のお勉強がてら。。  

- コピー対処のファイル
  - git statusで"Changes to be committed:"として表示されるファイル
  - ここで表示されるディレクトリ構成の状態で収集コピー
    - [] "../foo"は対象外とする
- 削除ファイルは赤字表示

## コマンド

> node gscopy [gitコマンド実行場所] ([出力先(デフォルト:./copy)])
