#!/bin/sh

# 获取剩余内存（单位：KB），从 "available" 列提取数据
free_mem=$(free | grep Mem: | tr -s ' ' | cut -d ' ' -f 7)

# 将 30MB 转换为 KB
threshold=$((30 * 1024))

# 检查 free_mem 是否为空或非数字
if [ -z "$free_mem" ] || ! echo "$free_mem" | grep -qE '^[0-9]+$'; then
    echo "Error: Unable to retrieve memory information."
    exit 1
fi

# 判断剩余内存是否小于 30MB
if [ "$free_mem" -lt "$threshold" ]; then
    echo "Memory is low: ${free_mem}KB. Cleaning up..."
    logger -t clean_memory "Memory is low: ${free_mem}KB. Cleaning up..."
    sync && echo 3 > /proc/sys/vm/drop_caches
else
    echo "Memory is sufficient: ${free_mem}KB. No action needed."
    logger -t clean_memory "Memory is sufficient: ${free_mem}KB. No action needed."
fi
