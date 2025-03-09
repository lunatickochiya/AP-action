# Actions-OpenWrt mod


 特色功能

- 可以替换package
- 给源码打入patch 加入自己的东西
- 单独上传ipk文件包
- 原生的openwrt管理系统
- 可编译99%的kmod 可用于直接安装内核模块
- Actions页面选择 Repo Dispatcher 点击 Run workflow

## 关于mt798x
 测试机器rax3000m nand ubootmod版本 请使用squashfs-sysupgrade刷入 不要刷factory的版本！
ubootmod：https://github.com/hanwckf/bl-mt798x/releases/download/20231124/mt798x-uboot-202307-fip.7z

- nokia_ea0326gmp_ubootmod 可使用 uboot ubi-110m 布局刷入 目前独有23.05 支持

- nokia_ea0326gmp_stock 版本 参考 ：
使用stock 布局（同原厂固件布局）刷入  ubi分区86.5M  可以刷入lean的lede

## 关于nokia_ea0326gmp uboot
请不要使用itb格式刷入  default分区对应stock固件 110M对应ubootmod 也可以刷入mt798x 闭源驱动固件

## 关于ramips
测试机器 Lenovo Y1 newifi d2 ghl-001

## 关于ath79
测试机器 dw33d

## 关于ipq
测试机器 ap8220

## 更新

# 20250309
-  Lenovo Y1 和 dw33d 持续更新 pisen wpr003n 支持完毕  mips机器将主要加入cups
-  nokia_ea0326gmp rax3000m nand ubootmod版本 后期将不再支持 因为没机器了  rax3000m-emmc将继续支持
-  全面升级到24.10 后期可能会移除23.05  目前全系列支持bcmfullcone 完善了SFE


## 源码更新交流学习：
 - 点击链接加入群聊 ：https://jq.qq.com/?_wv=1027&k=5QgVYsC
 - 群号： 286754582
 - 部分功能和补丁提取自 https://github.com/chenmozhijin/turboacc 感谢
