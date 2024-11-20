const filesContents = [
  {
    name: "file1.txt",
    path: "/path/to/file1.txt",
    content: `module example1;
  reg a, b, c;
  always @ (a or b)
  begin
    c = a & b;
  end
endmodule`
  },
  {
    name: "file2.txt",
    path: "/path/to/file2.txt",
    content: `module example2;
  reg x, y, z;
  always @ (x or y)
  begin
    z = x | y;
  end
endmodule`
  },
  {
    name: "file3.txt",
    path: "/path/to/file3.txt",
    content: `module example3;
  reg p, q, r;
  always @ (p or q)
  begin
    r = p ^ q;
  end
endmodule`
  },
  // Add more file contents here
];

export default filesContents;