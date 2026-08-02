include $(TOPDIR)/rules.mk

PKG_RELEASE:=15

LUCI_TITLE:=LAN端口切换
# Do not force firewall4. All firewall changes use the common UCI schema and
# work with the firewall3 package used by older/custom OpenWrt builds as well.
LUCI_DEPENDS:=+luci-base +rpcd +uci
LUCI_PKGARCH:=all

PKG_LICENSE:=GPL-2.0-only
PKG_MAINTAINER:=Router-mwan

define Package/luci-app-mwan-switch/conffiles
/etc/config/mwan-switch
endef

define Build/Prepare/luci-app-mwan-switch
	chmod 0755 $(PKG_BUILD_DIR)/root/etc/init.d/mwan-switch
	chmod 0755 $(PKG_BUILD_DIR)/root/etc/init.d/mwan-switch-monitor
	chmod 0755 $(PKG_BUILD_DIR)/root/etc/uci-defaults/40_luci-app-mwan-switch
endef

define Package/luci-app-mwan-switch/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	chmod 0755 /etc/init.d/mwan-switch /etc/init.d/mwan-switch-monitor /etc/uci-defaults/40_luci-app-mwan-switch
	/etc/uci-defaults/40_luci-app-mwan-switch && rm -f /etc/uci-defaults/40_luci-app-mwan-switch
	/etc/init.d/rpcd reload 2>/dev/null
}
exit 0
endef

define Package/luci-app-mwan-switch/prerm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/mwan-switch-monitor stop 2>/dev/null
	/etc/init.d/mwan-switch-monitor disable 2>/dev/null
	/etc/init.d/mwan-switch disable 2>/dev/null
}
exit 0
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
