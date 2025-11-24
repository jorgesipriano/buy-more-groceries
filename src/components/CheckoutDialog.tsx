import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CheckoutDialogProps {
                R$ { total.toFixed(2).replace('.', ',') }
              </span >
            </div >
          </div >

  <Button
    type="submit"
    size="lg"
    className="w-full bg-gradient-to-r from-secondary to-secondary/90 text-lg font-semibold hover:shadow-lg"
  >
    Confirmar Pedido
  </Button>
        </form >
      </DialogContent >
    </Dialog >
  );
}