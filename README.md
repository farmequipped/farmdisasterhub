# farm

### Manufactuer Setup or DIY

---

- flash rasberry pi 4b set "sage" as device and username, add wifi network of office and the Farm in question
- Use winscp or directly in console SCP or SSH connect and transfer this package to flashed rasberry pi via wifi connection into /home/pi/sage/
- Set up simple network tunnel over 443 on farmer network (if they want custom portal) and connect domain name alternatively use company cloudflare tunnel with company domain name
- Run Below commands inside of the project file

```

Run Following:

chmod +x start_nohup.sh
./start_nohup.sh

```

- Check working condition adjust any connections as needed

---

