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

- nokia_ea0326gmp_ubootmod 可使用 uboot qwrt-110m 布局刷入 目前独有23.05 支持
- nokia_ea0326gmp itb版本 参考 ：

A minimum configuration which enabled SSH access is also provided to simplify the process:
https://firmware.download.immortalwrt.eu.org/cnsztl/mediatek/filogic/openwrt-mediatek-mt7981-nokia-ea0326gmp-enable-ssh.tar.gz

Flash instructions:
1. SSH to EA0326GMP, backup everything, especially 'Factory' part.
2. Write new BL2:
   mtd write immortalwrt-mediatek-filogic-nokia_ea0326gmp-preloader.bin BL2
3. Write new FIP:
   mtd write immortalwrt-mediatek-filogic-nokia_ea0326gmp-bl31-uboot.fip FIP
4. Set static IP on your PC:
   IP 192.168.1.254/24, GW 192.168.1.1
5. Serve ImmortalWrt initramfs image using TFTP server.
6. Cut off the power and re-engage, wait for TFTP recovery to complete.
7. Run 'fw_setenv bootargs' if comes with SNAPSHOT u-boot.
8. After ImmortalWrt has booted, perform sysupgrade.

- nokia_ea0326gmp_stock 版本 参考 ：
使用stock 布局（原版布局）刷入  ubi分区86M左右

## 关于nokia_ea0326gmp uboot 来自恩山 并非本人编译

## 关于ramips
测试机器 Lenovo Y1 newifi d2 ghl-001
## 关于ath79
测试机器 dw33d
