#!/usr/bin/env python3
"""Restore the permanent pm.sa/tree entry point without affecting the subdomain."""
from pathlib import Path
import shutil,time
app=Path("/mnt/home-storage/home/pmsa/apps/shajara/shajara-api/public")
ht=app/".htaccess"
assert ht.is_file(), "No Laravel web-root rewrite file"
contents=ht.read_text()
marker="    # pm.sa/tree root compatibility: send users to the active genealogy search page."
if marker not in contents:
    block=(
        marker+"\n"
        +"    RewriteCond %{HTTP_HOST} ^(www\\.)?pm\\.sa$ [NC]\n"
        +"    RewriteCond %{REQUEST_URI} ^/tree/?$ [NC]\n"
        +"    RewriteRule ^$ /tree/lineage [R=302,L]\n"
    )
    assert contents.count("    RewriteEngine On")==1, "Unexpected Apache rewrite configuration"
    backup=ht.with_name(".htaccess.before-pm-tree-"+time.strftime("%Y%m%d-%H%M%S"))
    shutil.copy2(ht,backup)
    ht.write_text(contents.replace("    RewriteEngine On","    RewriteEngine On\n"+block,1))
    print("HTACCESS_BACKUP",backup)
print("PM_TREE_ROOT_REDIRECT_READY")
